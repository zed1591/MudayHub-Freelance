"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Briefcase, Building2, Globe, Plus, Search, Sparkles } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import { JOB_CATEGORIES, type Job } from "@/lib/types";
import { jobsApi } from "@/lib/api";
import { useSession } from "@/components/SessionProvider";

type SortKey = "newest" | "budget_asc" | "budget_desc";

function sortJobs(jobs: Job[], sort: SortKey): Job[] {
  const copy = [...jobs];
  switch (sort) {
    case "budget_asc":
      return copy.sort((a, b) => a.budget_etb - b.budget_etb);
    case "budget_desc":
      return copy.sort((a, b) => b.budget_etb - a.budget_etb);
    default:
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

function JobsList() {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const isClient = user?.role === "client";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [mineOnly, setMineOnly] = useState(searchParams.get("mine") === "true");
  const [sort, setSort] = useState<SortKey>("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      jobsApi
        .list({ q: q || undefined, category: category || undefined })
        .then((d) => setJobs(d.jobs || []))
        .catch(() => setJobs([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q, category]);

  const userSkillsLower = useMemo<string[]>(
    () => (user?.skills || []).map((s: string) => s.toLowerCase()),
    [user?.skills]
  );

  const myJobsCount = useMemo(() => {
    if (!user) return 0;
    return jobs.filter((j) => j.client_id === user.id).length;
  }, [jobs, user]);

  const displayed = useMemo(() => {
    let list = sortJobs(jobs, sort);

    // If client requested their own jobs only
    if (isClient && mineOnly && user) {
      list = list.filter((j) => j.client_id === user.id);
    }

    if (matchedOnly && userSkillsLower.length > 0) {
      list = list.filter((j) => {
        const categoryMatch = userSkillsLower.some(
          (s: string) => j.category.toLowerCase().includes(s) || s.includes(j.category.toLowerCase())
        );
        const skillMatch = j.skills.some((js: string) =>
          userSkillsLower.some((us: string) => js.toLowerCase().includes(us) || us.includes(js.toLowerCase()))
        );
        return categoryMatch || skillMatch;
      });
    }
    return list;
  }, [jobs, sort, isClient, mineOnly, user, matchedOnly, userSkillsLower]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header banner */}
      <div className="card-surface relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 shadow-sm">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700">
              <Briefcase className="h-3.5 w-3.5 text-brand" />
              <span>MudayHub &middot; Project RFPs · የፕሮጀክት ጨረታዎች</span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Project Requests &amp; RFPs
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isClient
                ? "Browse open marketplace briefs or manage your company's custom requirements and view submitted proposals."
                : "Explore open project briefs and submit formal solution pitches with your proposed milestones, pricing, and turnaround."}
            </p>

            {/* Client-specific View Switcher (My Postings vs All Marketplace) */}
            {isClient && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMineOnly(false)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    !mineOnly
                      ? "bg-brand text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>All Marketplace Briefs ({jobs.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMineOnly(true)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    mineOnly
                      ? "bg-brand text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>My Company&apos;s Postings ({myJobsCount})</span>
                </button>
              </div>
            )}

            {/* Hero Search Bar */}
            <div className="mt-6 flex max-w-xl gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search project requirements, skills, keywords…"
                  className="input-field !pl-11 !py-3 !text-xs font-medium"
                />
              </div>
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="btn-secondary !py-3 !px-5 text-xs font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {isClient && (
            <div className="shrink-0">
              <Link
                href="/jobs/new"
                className="btn-primary flex items-center gap-2 shadow-ochre !py-3.5 !px-6 font-bold"
              >
                <Plus className="h-4 w-4" />
                <span>Post a Project Brief</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Client Explanatory Notice */}
      {isClient && !mineOnly && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Globe className="h-4 w-4 text-brand shrink-0" />
            <span>
              <strong>Public Marketplace Directory:</strong> You are viewing open project briefs posted by companies across Ethiopia for independent specialists to bid on.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMineOnly(true)}
            className="text-xs font-bold text-brand hover:underline self-start sm:self-auto shrink-0"
          >
            Switch to My Company&apos;s Postings ({myJobsCount}) →
          </button>
        </div>
      )}

      {/* 2-Column Marketplace Layout */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Vertical Filter Sidebar */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="card-surface rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand" />
                <span>Categories</span>
              </h2>
              {category && (
                <button
                  type="button"
                  onClick={() => setCategory("")}
                  className="text-[11px] font-bold text-brand hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Dropdown Selector */}
            <div className="space-y-2">
              <label htmlFor="job-category-select" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Category Domain
              </label>
              <select
                id="job-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition"
              >
                <option value="">All Categories &amp; Domains</option>
                {JOB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Matched to My Skills (Freelancer only) */}
            {user?.role === "freelancer" && (
              <div className="border-t border-slate-100 pt-4">
                {userSkillsLower.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setMatchedOnly(!matchedOnly)}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold border transition ${
                      matchedOnly
                        ? "bg-brand text-white border-brand shadow-ochre"
                        : "bg-orange-50/80 text-brand-dark border-brand/25 hover:bg-orange-100"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Matched to My Skills</span>
                    </span>
                    <span className={`text-[10px] rounded px-1.5 py-0.5 ${matchedOnly ? "bg-white/20 text-white" : "bg-brand/10 text-brand-dark"}`}>
                      {userSkillsLower.length}
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/onboarding"
                    className="flex items-center gap-1.5 rounded-xl border border-brand/25 bg-orange-50/80 px-3 py-2 text-xs font-bold text-brand-dark hover:bg-orange-100 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-brand" />
                    <span>Set Skills to Match RFPs →</span>
                  </Link>
                )}
              </div>
            )}

            {/* Sort Control in Sidebar */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Order by
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-brand"
              >
                <option value="newest">Newest First</option>
                <option value="budget_desc">Budget: High → Low</option>
                <option value="budget_asc">Budget: Low → High</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Right Listings Column */}
        <main className="lg:col-span-9 space-y-5">
          {/* Results Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 text-xs">
            <div className="text-slate-500">
              Showing <span className="font-bold text-slate-900 font-mono">{displayed.length}</span> {mineOnly ? "of your company's" : "marketplace"} project RFPs
              {category && (
                <span> in <span className="font-bold text-brand-dark">{category}</span></span>
              )}
              {q && (
                <span> matching &quot;<span className="text-slate-900">{q}</span>&quot;</span>
              )}
            </div>

            {(category || q) && (
              <button
                type="button"
                onClick={() => { setCategory(""); setQ(""); }}
                className="text-xs text-brand hover:underline font-bold"
              >
                Reset all filters
              </button>
            )}
          </div>

          {/* Jobs Grid */}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card-surface h-52 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="card-surface rounded-3xl p-16 text-center border border-slate-200 bg-white shadow-sm">
              <p className="text-lg font-bold text-slate-900">
                {mineOnly ? "You haven't posted any project RFPs yet" : "No project requests found"}
              </p>
              <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {mineOnly
                  ? "Publish your custom requirements to receive competitive solution pitches from verified Ethiopian specialists."
                  : q || category
                  ? "Try clearing your filters or searching with different keywords."
                  : "Be the first to post a new project request on Muday-Freelance!"}
              </p>
              {isClient && (
                <Link href="/jobs/new" className="btn-primary mt-6 !text-xs !py-3 !px-6 font-bold shadow-ochre inline-block">
                  Post a Project Brief
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {displayed.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center p-8">
          <div className="h-64 w-full max-w-xl animate-pulse rounded-3xl bg-slate-100" />
        </div>
      }
    >
      <JobsList />
    </Suspense>
  );
}
