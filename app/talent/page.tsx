"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Search, SlidersHorizontal, Star, Users, Zap, Crown, Award, Calendar } from "lucide-react";
import type { Profile } from "@/lib/types";
import { computeFreelancerLevel } from "@/lib/levels";
import { formatMemberSince } from "@/lib/utils";

interface TalentItem {
  profile: Profile;
  email: string;
  completed_contracts: number;
  active_gigs: number;
  reviews_count: number;
}

type SortKey = "relevance" | "rating" | "completed" | "newest";

function sortTalent(items: TalentItem[], sort: SortKey): TalentItem[] {
  const copy = [...items];
  switch (sort) {
    case "rating":
      return copy.sort((a, b) => Number(b.profile.rating) - Number(a.profile.rating));
    case "completed":
      return copy.sort((a, b) => b.completed_contracts - a.completed_contracts);
    case "newest":
      return copy.sort(
        (a, b) =>
          new Date(b.profile.created_at).getTime() - new Date(a.profile.created_at).getTime()
      );
    default:
      // relevance: verified first, then rating, then completed contracts
      return copy.sort(
        (a, b) =>
          Number(b.profile.is_verified) - Number(a.profile.is_verified) ||
          Number(b.profile.rating) - Number(a.profile.rating) ||
          b.completed_contracts - a.completed_contracts
      );
  }
}

export default function TalentDirectoryPage() {
  const [talent, setTalent] = useState<TalentItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState("0");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedSkill) params.set("skill", selectedSkill);
    if (verifiedOnly) params.set("verified", "true");
    if (minRating !== "0") params.set("min_rating", minRating);

    fetch(`/api/talent?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setTalent(data.talent || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query, selectedSkill, verifiedOnly, minRating]);

  const displayed = useMemo(() => sortTalent(talent, sort), [talent, sort]);

  const topSkills = [
    "All Skills", "React", "Next.js", "TypeScript", "Telebirr",
    "Figma", "Brand Design", "OWASP", "Flutter", "Amharic",
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <div className="card-surface relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 shadow-sm">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #DF8A33, #BD5D38, transparent 70%)" }}
        />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand-dark">
            <Users className="h-3.5 w-3.5 text-brand" />
            <span>MudayHub &middot; Specialist Directory</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Vetted Engineering Specialists
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Search verified software engineers, cybersecurity auditors, cloud architects, and product designers with audited track records.
          </p>
          <div className="mt-7 flex max-w-xl gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search specialists by name, domain, or skills (e.g. Next.js, Cyber Pentest, Telebirr, AI)..."
                className="input-field !pl-11 !py-3 !text-xs font-medium"
              />
            </div>
            {query && (
              <button onClick={() => setQuery("")} className="btn-secondary !py-3 !px-5 text-xs font-semibold">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Marketplace Layout */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Vertical Filter Sidebar */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="card-surface rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-6">
            {/* Skill / Specialty Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand" />
                  <span>Specialty</span>
                </h2>
                {selectedSkill && (
                  <button
                    type="button"
                    onClick={() => setSelectedSkill("")}
                    className="text-[11px] font-bold text-brand hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <label htmlFor="talent-skill-select" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block pt-1">
                Domain / Technology
              </label>
              <select
                id="talent-skill-select"
                value={selectedSkill || "All Skills"}
                onChange={(e) => setSelectedSkill(e.target.value === "All Skills" ? "" : e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition"
              >
                {topSkills.map((sk) => (
                  <option key={sk} value={sk}>
                    {sk === "All Skills" ? "All Specialties & Skills" : sk}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Rating */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Minimum Rating
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-brand"
              >
                <option value="0">Any Rating</option>
                <option value="4">4.0+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.8">4.8+ Stars</option>
              </select>
            </div>

            {/* Verified Only Toggle */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Verification
              </label>
              <button
                type="button"
                aria-pressed={verifiedOnly}
                onClick={() => setVerifiedOnly((v) => !v)}
                className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition ${
                  verifiedOnly
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-bold"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  <span>Verified Specialists</span>
                </span>
                <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  verifiedOnly ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white"
                }`}>
                  {verifiedOnly ? "✓" : ""}
                </span>
              </button>
            </div>

            {/* Reset All */}
            {(verifiedOnly || minRating !== "0" || selectedSkill || query) && (
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => { setVerifiedOnly(false); setMinRating("0"); setSelectedSkill(""); setQuery(""); }}
                  className="w-full text-center py-2 text-xs font-bold text-brand hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Listings Column */}
        <main className="lg:col-span-9 space-y-5">
          {/* Results Summary & Sort Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 text-xs">
            <div className="text-slate-500">
              Showing <strong className="text-slate-900 font-mono">{displayed.length}</strong> professionals
              {selectedSkill && (
                <span> for <strong className="text-brand-dark">{selectedSkill}</strong></span>
              )}
              {verifiedOnly && <span> · <strong className="text-emerald-700">verified only</strong></span>}
            </div>

            <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <SlidersHorizontal className="h-3.5 w-3.5 text-brand" />
              Sort:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none"
              >
                <option value="relevance">Most Relevant</option>
                <option value="rating">Highest Rated</option>
                <option value="completed">Most Contracts</option>
                <option value="newest">Newest Members</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card-surface h-72 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="card-surface rounded-3xl p-16 text-center border border-slate-200 bg-white shadow-sm">
              <p className="text-base font-bold text-slate-900">No freelancers found</p>
              <p className="mt-2 text-xs text-slate-500">Try clearing your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {displayed.map((item) => {
              const level = computeFreelancerLevel(Number(item.profile.rating), item.completed_contracts);

              return (
                <div
                  key={item.profile.id}
                  className="card-surface group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 transition-all duration-300 hover:border-brand/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        {item.profile.avatar_url ? (
                          <Image
                            src={item.profile.avatar_url}
                            alt={item.profile.full_name || "Specialist"}
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-2xl object-cover shadow-sm ring-1 ring-brand/20 shrink-0"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-terracotta text-lg font-bold text-white shadow-md shadow-brand/20 ring-1 ring-white/20 shrink-0">
                            {(item.profile.full_name || "Specialist")
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("") || "SP"}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-slate-900 transition group-hover:text-brand">
                              {item.profile.full_name || "Marketplace professional"}
                            </h3>
                            {item.profile.is_verified && (
                              <span title="Verified profile">
                                <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>Since {formatMemberSince(item.profile.created_at)}</span>
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${level.bgClass} ${level.colorClass} ${level.borderClass}`}>
                              {level.id === "master" && <Crown className="h-3 w-3 fill-purple-400 text-purple-600" />}
                              {level.id === "top_rated" && <Star className="h-3 w-3 fill-amber-400 text-amber-500" />}
                              {level.id === "rising" && <Zap className="h-3 w-3 text-brand" />}
                              {level.id === "verified" && <Award className="h-3 w-3 text-emerald-600" />}
                              <span>{level.badgeLabel}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 font-bold text-amber-600 font-mono">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        <span className="text-slate-900">{Number(item.profile.rating).toFixed(1)}</span>
                      </div>
                      <span className="text-slate-300">·</span>
                      <div className="text-slate-500">
                        <span className="font-bold text-slate-900 font-mono">{item.completed_contracts}</span> completed
                      </div>
                      <span className="text-slate-300">·</span>
                      <div className="text-slate-500">
                        <span className="font-bold text-brand font-mono">{item.active_gigs}</span> services
                      </div>
                      <span className="text-slate-300">·</span>
                      <div className="text-slate-500">
                        <span className="font-bold text-slate-800 font-mono">{item.reviews_count}</span> reviews
                      </div>
                    </div>

                    <p className="mt-3.5 line-clamp-3 text-xs leading-relaxed text-slate-600">
                      {item.profile.bio || "Available for custom projects and service work on MudayHub."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {(item.profile.skills || []).slice(0, 5).map((skill) => (
                        <button
                          key={skill}
                          onClick={() => setSelectedSkill(skill)}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:border-brand/40 hover:bg-orange-50 hover:text-brand-dark transition"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <Link
                      href={`/profiles/${item.profile.id}`}
                      className="btn-secondary !py-2.5 !text-xs w-full text-center font-bold inline-flex items-center justify-center gap-1.5"
                    >
                      <span>View Profile &amp; Services</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
