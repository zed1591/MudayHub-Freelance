"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileCheck2,
  Briefcase,
  FileText,
  Sparkles,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { formatEtb } from "@/lib/utils";
import type { Contract, Gig, Job, Proposal } from "@/lib/types";

export type EngagementsSubTab = "contracts" | "postings" | "proposals";

interface Props {
  isClient: boolean;
  contracts: Contract[];
  myJobs: Job[];
  myGigs: Gig[];
  proposals: Proposal[];
  initialSubTab?: EngagementsSubTab;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export function EngagementsWorkspace({
  isClient,
  contracts,
  myJobs,
  myGigs,
  proposals,
  initialSubTab = "contracts",
  isFullScreen,
  onToggleFullScreen,
}: Props) {
  const [subTab, setSubTab] = useState<EngagementsSubTab>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const query = searchQuery.toLowerCase().trim();

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const title = (c.gigs?.title || c.jobs?.title || "Contract").toLowerCase();
      const ref = (c.payment_reference || c.id).toLowerCase();
      const matchesSearch = !query || title.includes(query) || ref.includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && (c.escrow_status === "funded" || c.escrow_status === "work_submitted")) ||
        (statusFilter === "settled" && c.escrow_status === "completed") ||
        (statusFilter === "disputed" && c.escrow_status === "disputed");
      return matchesSearch && matchesStatus;
    });
  }, [contracts, query, statusFilter]);

  // Filtered Postings (Jobs or Gigs)
  const filteredJobs = useMemo(() => {
    return myJobs.filter((j) => {
      const matchesSearch = !query || j.title.toLowerCase().includes(query) || j.category.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || j.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [myJobs, query, statusFilter]);

  const filteredGigs = useMemo(() => {
    return myGigs.filter((g) => {
      const matchesSearch = !query || g.title.toLowerCase().includes(query) || g.category.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? g.is_published !== false : g.is_published === false);
      return matchesSearch && matchesStatus;
    });
  }, [myGigs, query, statusFilter]);

  // Filtered Proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const title = (p.jobs?.title || "Proposal").toLowerCase();
      const specialist = (p.profiles?.full_name || "").toLowerCase();
      const matchesSearch = !query || title.includes(query) || specialist.includes(query);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [proposals, query, statusFilter]);

  const postingsCount = isClient ? myJobs.length : myGigs.length;

  return (
    <div className="space-y-5">
      {/* Tactical Sub-Navigation & Filter Bar */}
      <div className="card-surface rounded-2xl border border-slate-200/90 p-4 shadow-sm bg-white space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Sub-Tabs Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setSubTab("contracts");
                setStatusFilter("all");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                subTab === "contracts"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <FileCheck2 className={`h-4 w-4 ${subTab === "contracts" ? "text-brand" : "text-slate-400"}`} />
              <span>Escrow Contracts</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                subTab === "contracts" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {contracts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubTab("postings");
                setStatusFilter("all");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                subTab === "postings"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {isClient ? (
                <Briefcase className={`h-4 w-4 ${subTab === "postings" ? "text-brand" : "text-slate-400"}`} />
              ) : (
                <Sparkles className={`h-4 w-4 ${subTab === "postings" ? "text-brand" : "text-slate-400"}`} />
              )}
              <span>{isClient ? "My RFPs" : "Published Services"}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                subTab === "postings" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {postingsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubTab("proposals");
                setStatusFilter("all");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                subTab === "proposals"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <FileText className={`h-4 w-4 ${subTab === "proposals" ? "text-brand" : "text-slate-400"}`} />
              <span>{isClient ? "Applicant Bids" : "Submitted Bids"}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                subTab === "proposals" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {proposals.length}
              </span>
            </button>
          </div>

          {/* Quick Actions & Fullscreen Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleFullScreen && (
              <button
                type="button"
                onClick={onToggleFullScreen}
                className="btn-secondary !py-2 !px-3 text-xs font-bold flex items-center gap-1.5 hover:border-slate-300"
                title={isFullScreen ? "Exit Fullscreen" : "Expand Fullscreen Workspace"}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5 text-slate-600" />
                    <span className="hidden sm:inline">Compact View</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5 text-slate-600" />
                    <span className="hidden sm:inline">Full Screen Workspace</span>
                  </>
                )}
              </button>
            )}

            {subTab === "contracts" && (
              <Link href="/contracts" className="btn-secondary !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5">
                <span>Contracts Center</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </Link>
            )}

            {subTab === "postings" && (
              isClient ? (
                <Link href="/jobs/new" className="btn-c2sa !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Post RFP</span>
                </Link>
              ) : (
                <Link href="/gigs/new" className="btn-c2sa !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Service</span>
                </Link>
              )
            )}

            {subTab === "proposals" && (
              <Link href="/proposals" className="btn-secondary !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5">
                <span>Submitted Console</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </Link>
            )}
          </div>
        </div>

        {/* Live Search & Contextual Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${subTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-slate-500 mr-1 uppercase tracking-wider">Status:</span>
            {subTab === "contracts" && (
              <>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({contracts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === "active" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Active ({contracts.filter((c) => c.escrow_status === "funded" || c.escrow_status === "work_submitted").length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("settled")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === "settled" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Settled ({contracts.filter((c) => c.escrow_status === "completed").length})
                </button>
              </>
            )}

            {subTab === "postings" && (
              <>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({postingsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(isClient ? "open" : "active")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === (isClient ? "open" : "active") ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Live &amp; Open
                </button>
              </>
            )}

            {subTab === "proposals" && (
              <>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({proposals.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === "pending" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Under Review ({proposals.filter((p) => p.status === "pending").length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("accepted")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === "accepted" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Awarded ({proposals.filter((p) => p.status === "accepted").length})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Full-Screen Workspace Panel */}
      <div className="w-full">
        {/* SUBTAB 1: ESCROW CONTRACTS */}
        {subTab === "contracts" && (
          filteredContracts.length === 0 ? (
            <div className="card-surface rounded-2xl p-12 text-center text-xs text-slate-500 border border-slate-200">
              No escrow engagements found.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredContracts.map((c) => {
                const contractTitle = c.gigs?.title || c.jobs?.title || "Contract Engagement";
                const isFunded = c.escrow_status === "funded" || c.escrow_status === "work_submitted";
                const isCompleted = c.escrow_status === "completed";

                return (
                  <div
                    key={c.id}
                    className="card-surface rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-4 bg-white"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="badge-c2sa text-[10px]">
                          {c.package_tier ? `${c.package_tier} Service` : "Project Escrow"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : isFunded
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          <span className="capitalize">{c.escrow_status.replace(/_/g, " ")}</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                        {contractTitle}
                      </h3>

                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-mono text-slate-500">
                          Ref: {c.payment_reference || c.id.slice(0, 8)}
                        </span>
                        <span className="font-mono font-black text-slate-900">
                          {formatEtb(c.total_amount_etb)}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/contracts/${c.id}`}
                      className="btn-c2sa w-full !py-2 !text-xs font-bold text-center block"
                    >
                      Open Escrow Room →
                    </Link>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* SUBTAB 2: POSTINGS (RFPs or Gigs) */}
        {subTab === "postings" && (
          isClient ? (
            filteredJobs.length === 0 ? (
              <div className="card-surface rounded-2xl p-12 text-center text-xs text-slate-500 border border-slate-200">
                No project requests found. Post an RFP to receive specialist bids.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="card-surface rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-4 bg-white"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="badge-c2sa text-[10px]">{job.category}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 capitalize">
                          {job.status}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {job.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 font-mono text-xs font-bold text-slate-900">
                        <span>Budget</span>
                        <span>{formatEtb(job.budget_etb)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/jobs/${job.id}`}
                      className="btn-secondary w-full !py-2 !text-xs font-bold text-center block hover:border-slate-400 hover:text-slate-900"
                    >
                      View Applicants →
                    </Link>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredGigs.length === 0 ? (
              <div className="card-surface rounded-2xl p-12 text-center text-xs text-slate-500 border border-slate-200">
                No services published yet. Publish a 3-tier catalog gig to receive direct orders.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredGigs.map((g) => (
                  <div
                    key={g.id}
                    className="card-surface rounded-2xl p-4 border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-3 bg-white"
                  >
                    <div className="space-y-2.5">
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                        <Image
                          src={
                            g.cover_image ||
                            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80"
                          }
                          alt={g.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 300px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="badge-c2sa text-[10px]">{g.category}</span>
                        <span className="font-mono font-bold text-slate-900">
                          From {formatEtb(g.packages.basic.price_etb)}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 text-xs font-bold text-slate-900 leading-snug">
                        {g.title}
                      </h3>
                    </div>

                    <Link
                      href={`/gigs/${g.id}`}
                      className="btn-secondary w-full !text-xs !py-1.5 text-center block font-bold hover:border-slate-400 hover:text-slate-900"
                    >
                      View Offering →
                    </Link>
                  </div>
                ))}
              </div>
            )
          )
        )}

        {/* SUBTAB 3: PROPOSALS & BIDS */}
        {subTab === "proposals" && (
          filteredProposals.length === 0 ? (
            <div className="card-surface rounded-2xl p-12 text-center text-xs text-slate-500 border border-slate-200">
              No proposals found.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProposals.map((p) => {
                const freelancerName = p.profiles?.full_name || "Specialist";
                const jobTitle = p.jobs?.title || "Custom RFP Project";

                const isAccepted = p.status === "accepted";
                const isRejected = p.status === "rejected";

                return (
                  <div
                    key={p.id}
                    className="card-surface rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-4 bg-white"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isAccepted
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : isRejected
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {isAccepted ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : isRejected ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          <span className="capitalize">{p.status}</span>
                        </span>

                        <span className="font-mono text-xs font-bold text-slate-500">
                          {p.duration_days} Days
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {isClient ? `${freelancerName} · ${jobTitle}` : jobTitle}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {p.cover_letter}
                      </p>

                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between text-xs font-mono">
                        <span className="text-[11px] text-slate-500">Proposed Amount</span>
                        <strong className="text-slate-900">{formatEtb(p.bid_amount_etb)}</strong>
                      </div>
                    </div>

                    <Link
                      href={`/jobs/${p.job_id}`}
                      className="btn-secondary w-full !py-2 !text-xs font-bold text-center block hover:border-slate-400 hover:text-slate-900"
                    >
                      {isClient ? "Review & Hire →" : "View Project RFP →"}
                    </Link>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
