"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  Check,
  Clock,
  RefreshCw,
  ShieldCheck,
  Star,
  Wallet,
  Share2,
  ArrowLeft,
} from "lucide-react";
import { formatEtb } from "@/lib/utils";
import type { Gig, Review } from "@/lib/types";
import { useSession } from "@/components/SessionProvider";

type Tier = "basic" | "standard" | "premium";

export default function GigDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();

  const [gig, setGig] = useState<Gig | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedTier, setSelectedTier] = useState<Tier>("standard");
  const [requirements, setRequirements] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  function copyShareLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  useEffect(() => {
    fetch(`/api/gigs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.gig) {
          setGig(data.gig);
          setReviews(data.reviews || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-400">
        Loading service details…
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900">Service not found</h2>
        <Link href="/gigs" className="btn-secondary mt-5 inline-block text-xs">
          Return to Services Catalog
        </Link>
      </div>
    );
  }

  const pkg = gig.packages[selectedTier];

  async function handleOrder() {
    if (!user) {
      router.push(`/login?return=/gigs/${gig?.id}`);
      return;
    }

    setOrdering(true);
    setOrderError("");
    try {
      const res = await fetch(`/api/gigs/${gig?.id}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageTier: selectedTier,
          requirements: requirements.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      // Redirect immediately to the contract escrow room!
      router.push(`/contracts/${data.contract.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Order failed";
      setOrderError(msg);
      setOrdering(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/gigs" className="hover:text-slate-900 transition flex items-center gap-1 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Services</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-brand-dark">{gig.category}</span>
        </div>

        <button
          type="button"
          onClick={copyShareLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-sm"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-slate-500" />}
          <span>{copied ? "Link Copied!" : "Share Service"}</span>
        </button>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-12">
        {/* Left Column (8 cols): Portfolio, Description, Seller & Reviews */}
        <div className="space-y-8 lg:col-span-8">
          {/* Title & Seller Mini Bar */}
          <div>
            <h1 className="text-2xl font-extrabold leading-snug text-slate-900 sm:text-4xl">
              {gig.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                href={`/profiles/${gig.freelancer_id}`}
                className="group flex items-center gap-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-terracotta text-sm font-bold text-white shadow-sm">
                  {gig.freelancer?.full_name?.charAt(0) || "F"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-brand-dark transition">
                      {gig.freelancer?.full_name}
                    </span>
                    {gig.freelancer?.is_verified && (
                      <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <span className="text-xs text-slate-500">Verified Muday Specialist</span>
                </div>
              </Link>

              <div className="h-4 w-px bg-slate-200" />

              <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                <Star className="h-4 w-4 fill-amber-500" />
                <span>{gig.rating ? Number(gig.rating).toFixed(1) : "5.0"}</span>
                <span className="text-slate-500 font-normal text-xs">({gig.reviews_count || 0})</span>
              </div>

              <div className="h-4 w-px bg-slate-200" />

              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-800">
                {gig.orders_completed || 0} orders completed
              </span>
            </div>
          </div>

          {/* Media / Gallery */}
          <div className="card-surface overflow-hidden rounded-3xl border border-slate-200/90 shadow-sm relative aspect-video w-full bg-slate-100">
            <Image
              src={
                gig.cover_image ||
                "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80"
              }
              alt={gig.title}
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              className="object-cover"
              priority
            />
          </div>

          {/* Description */}
          <div className="card-surface space-y-5 rounded-3xl border border-slate-200/90 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">About This Service</h2>
            <div className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {gig.description}
            </div>

            {/* Tags */}
            <div className="pt-5 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Skills &amp; Technologies
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {gig.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Seller Bio Card */}
          <div className="card-surface space-y-6 rounded-3xl border border-slate-200/90 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Meet Your Specialist</h2>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-terracotta text-2xl font-bold text-white shadow-sm">
                {gig.freelancer?.full_name?.charAt(0) || "F"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{gig.freelancer?.full_name}</h3>
                  {gig.freelancer?.is_verified && (
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {gig.freelancer?.bio || "Experienced talent delivering high quality services on Muday-Freelance."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-slate-500">Location</span>
                <p className="mt-1 font-bold text-slate-900">Addis Ababa, ET</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-slate-500">Languages</span>
                <p className="mt-1 font-bold text-slate-900">Amharic, English</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-slate-500">Avg. Response</span>
                <p className="mt-1 font-bold text-slate-900">1 Hour</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-slate-500">Payout Rail</span>
                <p className="mt-1 font-bold text-emerald-700">Telebirr / CBE</p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/profiles/${gig.freelancer_id}`}
                className="btn-secondary inline-block !text-xs font-semibold"
              >
                View Full Specialist Profile &amp; History
              </Link>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="card-surface space-y-6 rounded-3xl border border-slate-200/90 p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Client Reviews &amp; Feedback ({reviews.length})
              </h2>
              <div className="flex items-center gap-1.5 text-amber-500 text-sm font-bold">
                <Star className="h-4 w-4 fill-amber-500" />
                <span>{gig.rating ? Number(gig.rating).toFixed(2) : "5.00"}</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500">No reviews yet for this service.</p>
            ) : (
              <div className="divide-y divide-slate-100 space-y-5">
                {reviews.map((rev) => (
                  <div key={rev.id} className="pt-5 first:pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand to-terracotta text-xs font-bold text-white">
                          {rev.author?.full_name?.charAt(0) || "C"}
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          {rev.author?.full_name || "Verified Client"}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < rev.rating ? "fill-amber-500 text-amber-500" : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600">{rev.comment}</p>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {new Date(rev.created_at).toLocaleDateString()} · Verified Escrow Release
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Column (4 cols): Modern 3-Tier Package Pricing Box */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 card-surface overflow-hidden rounded-3xl border border-slate-200/90 shadow-sm">
            {/* 3 Tabs: Basic | Standard | Premium */}
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold">
              {(["basic", "standard", "premium"] as const).map((tier) => {
                const active = selectedTier === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`py-3.5 capitalize transition-all duration-150 ${
                      active
                        ? "border-b-2 border-brand bg-white text-brand-dark font-bold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>

            <div className="p-7 space-y-6">
              {/* Price & Package Name */}
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wider text-brand-dark font-bold">
                  {pkg.title}
                </span>
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {formatEtb(pkg.price_etb)}
                </span>
              </div>

              {/* Package Description */}
              <p className="text-xs leading-relaxed text-slate-600">{pkg.description}</p>

              {/* Delivery & Revisions Info */}
              <div className="flex items-center gap-6 text-xs text-slate-600 border-y border-slate-100 py-3.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand" />
                  <span className="font-bold text-slate-900">{pkg.delivery_days} Days</span> Turnaround
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-brand" />
                  <span className="font-bold text-slate-900">
                    {pkg.revisions === 99 ? "Unlimited" : pkg.revisions}
                  </span>{" "}
                  Revisions
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  What&apos;s Included:
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  {pkg.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Order / Continue Button or Owner Notice */}
              <div>
                {user?.id === gig.freelancer_id ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-blue-950">
                      <BadgeCheck className="h-4 w-4 text-blue-600" />
                      <span>You own this service listing</span>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Clients purchase this package to initiate milestone contracts with you. You can manage and edit your active services from your seller dashboard.
                    </p>
                    <Link
                      href="/dashboard"
                      className="btn-secondary !text-xs !py-2.5 w-full block text-center font-bold"
                    >
                      Manage Service in Dashboard &rarr;
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="btn-primary w-full !py-3.5 text-xs sm:text-sm font-bold shadow-ochre flex items-center justify-center gap-2"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Order Now ({formatEtb(pkg.price_etb)})</span>
                  </button>
                )}
              </div>

              {/* Service terms notice */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-slate-700 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-emerald-950">Review the service terms</span>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Confirm the scope, revision rounds, and delivery time before placing an order. Payment availability is shown at contract checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-lg rounded-3xl border border-slate-200 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="badge-brand">
                {selectedTier.toUpperCase()} Package
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Escrow Protected
              </span>
            </div>

            <h3 className="mt-3 text-xl font-bold text-slate-900">
              Confirm Order Checkout
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              {gig.title} — <span className="font-semibold text-slate-900">{pkg.title}</span>
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Package Price:</span>
                <span className="font-bold text-slate-900 font-mono">{formatEtb(pkg.price_etb)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform Escrow Fee:</span>
                <span className="font-bold text-emerald-700">0 ETB (0% for clients)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Delivery:</span>
                <span className="font-bold text-slate-900">{pkg.delivery_days} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Revisions:</span>
                <span className="font-bold text-slate-900">
                  {pkg.revisions === 99 ? "Unlimited" : pkg.revisions}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Project Brief &amp; Requirements (Optional)
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Describe your requirements, specifications, or reference links..."
                className="input-field min-h-[90px] text-xs"
              />
            </div>

            {orderError && (
              <p className="mt-3 text-xs font-semibold text-rose-600">{orderError}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="btn-secondary !text-xs font-semibold"
                disabled={ordering}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOrder}
                className="btn-primary !text-xs font-bold flex items-center gap-1.5 shadow-ochre"
                disabled={ordering}
              >
                {ordering ? "Creating Contract…" : "Proceed to Escrow Deposit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
