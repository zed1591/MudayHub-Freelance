"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Layers, Plus, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { GIG_CATEGORIES, type Gig } from "@/lib/types";
import { GigCard } from "@/components/GigCard";
import { useSession } from "@/components/SessionProvider";

const ALL_CATEGORIES = ["All Categories", ...GIG_CATEGORIES] as const;

type SortKey = "relevance" | "rating" | "price_asc" | "price_desc" | "newest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Most Relevant" },
  { value: "rating", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest First" },
];

function sortGigs(gigs: Gig[], sort: SortKey): Gig[] {
  const copy = [...gigs];
  switch (sort) {
    case "rating":
      return copy.sort((a, b) => Number(b.rating ?? 5) - Number(a.rating ?? 5));
    case "price_asc":
      return copy.sort((a, b) => a.packages.basic.price_etb - b.packages.basic.price_etb);
    case "price_desc":
      return copy.sort((a, b) => b.packages.basic.price_etb - a.packages.basic.price_etb);
    case "newest":
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    default:
      // relevance: verified + rating + orders_completed
      return copy.sort(
        (a, b) =>
          Number(b.freelancer?.is_verified ?? false) - Number(a.freelancer?.is_verified ?? false) ||
          Number(b.rating ?? 5) - Number(a.rating ?? 5) ||
          (b.orders_completed ?? 0) - (a.orders_completed ?? 0)
      );
  }
}

export default function GigsMarketplacePage() {
  const { user } = useSession();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Read URL params on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const cat = sp.get("category") || sp.get("cat");
      const q = sp.get("q");
      if (cat && ALL_CATEGORIES.includes(cat as (typeof ALL_CATEGORIES)[number])) {
        setSelectedCategory(cat);
      }
      if (q) setSearchQuery(q);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "All Categories") {
      params.set("category", selectedCategory);
    }
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    fetch(`/api/gigs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setGigs(data.gigs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCategory, searchQuery, minPrice, maxPrice]);

  // Client-side sort + verified filter (no extra round-trip needed)
  const displayed = useMemo(() => {
    const filtered = verifiedOnly
      ? gigs.filter((g) => g.freelancer?.is_verified)
      : gigs;
    return sortGigs(filtered, sort);
  }, [gigs, sort, verifiedOnly]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value;
    startTransition(() => setSearchQuery(q));
  }

  const hasFilters =
    selectedCategory !== "All Categories" || searchQuery || minPrice || maxPrice || verifiedOnly;

  function resetAll() {
    setSelectedCategory("All Categories");
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setVerifiedOnly(false);
    setSort("relevance");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Top Banner & Search */}
      <div className="card-surface relative overflow-hidden rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm bg-white">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>MudayHub &middot; Services &amp; Packages Marketplace</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Pre-Packaged Services &amp; Gigs
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Order ready-to-deploy deliverables with fixed scope, clear milestones, and guaranteed Telebirr escrow protection.
          </p>
          <form onSubmit={handleSearch} className="mt-7 flex max-w-xl gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search cyber pentest, Next.js, Figma, Telebirr mini-apps..."
                className="input-field !pl-11 !py-3 !text-xs font-medium !bg-white !border-slate-200"
              />
            </div>
            <button type="submit" className="btn-primary !py-3 !px-6 whitespace-nowrap shadow-ochre">
              Search
            </button>
          </form>
        </div>
        {user?.role === "freelancer" && (
          <div className="mt-6 flex sm:absolute sm:bottom-10 sm:right-10 sm:mt-0">
            <Link href="/gigs/new" className="btn-primary flex items-center gap-2 shadow-ochre">
              <Plus className="h-4 w-4" />
              <span>Offer a Service</span>
            </Link>
          </div>
        )}
      </div>

      {/* 2-Column Marketplace Layout */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Vertical Filter Sidebar */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="card-surface rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-6">
            {/* Category Filter Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-brand" />
                  <span>Category</span>
                </h2>
                {selectedCategory !== "All Categories" && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("All Categories")}
                    className="text-[11px] font-bold text-brand hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <label htmlFor="gig-category-select" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block pt-1">
                Service Domain
              </label>
              <select
                id="gig-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Budget (ETB)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand"
                />
                <span className="text-slate-400 text-xs">–</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Verified Only Toggle */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Specialist Status
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
                <span>Verified Specialists</span>
                <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  verifiedOnly ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white"
                }`}>
                  {verifiedOnly ? "✓" : ""}
                </span>
              </button>
            </div>

            {/* Reset All */}
            {hasFilters && (
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={resetAll}
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
              Showing <span className="font-bold text-slate-900 font-mono">{displayed.length}</span> services in{" "}
              <span className="font-bold text-brand-dark">{selectedCategory}</span>
              {searchQuery && (
                <span> matching &quot;<span className="text-slate-900 font-semibold">{searchQuery}</span>&quot;</span>
              )}
            </div>

            <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <SlidersHorizontal className="h-3.5 w-3.5 text-brand" />
              Sort:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Gigs Grid */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card-surface h-80 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="card-surface rounded-3xl p-16 text-center border border-slate-200 bg-white shadow-sm">
              <p className="text-lg font-bold text-slate-900">No services found</p>
              <p className="mt-2 text-xs text-slate-500">
                Try adjusting your filters or browsing all categories.
              </p>
              <button onClick={resetAll} className="btn-primary mt-6 !text-xs !py-2.5 !px-5 font-bold shadow-ochre">
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayed.map((gig) => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
