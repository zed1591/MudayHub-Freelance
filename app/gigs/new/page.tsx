"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Layers, ShieldCheck } from "lucide-react";
import { GIG_CATEGORIES } from "@/lib/types";
import { useSession } from "@/components/SessionProvider";

export default function NewGigPage() {
  const router = useRouter();
  const { user } = useSession();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(GIG_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState("");

  // Basic Package
  const [basicTitle, setBasicTitle] = useState("Starter Concept");
  const [basicDesc, setBasicDesc] = useState("Essential deliverables to get you started.");
  const [basicPrice, setBasicPrice] = useState(5000);
  const [basicDays, setBasicDays] = useState(3);
  const [basicRevisions, setBasicRevisions] = useState(2);
  const [basicFeatures, setBasicFeatures] = useState("Core Deliverable, Source Files, Fast Turnaround");

  // Standard Package
  const [stdTitle, setStdTitle] = useState("Standard Solution");
  const [stdDesc, setStdDesc] = useState("Complete package for growing businesses.");
  const [stdPrice, setStdPrice] = useState(15000);
  const [stdDays, setStdDays] = useState(7);
  const [stdRevisions, setStdRevisions] = useState(4);
  const [stdFeatures, setStdFeatures] = useState("Full Solution, Source Code, Payment Gateway, 3 Revisions");

  // Premium Package
  const [premTitle, setPremTitle] = useState("Enterprise VIP Suite");
  const [premDesc, setPremDesc] = useState("Full production-ready suite with priority support.");
  const [premPrice, setPremPrice] = useState(35000);
  const [premDays, setPremDays] = useState(14);
  const [premRevisions, setPremRevisions] = useState(99);
  const [premFeatures, setPremFeatures] = useState("Full Enterprise Build, Priority Support, Custom Integrations, Unlimited Revisions");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (user && user.role !== "freelancer" && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
          <Layers className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Freelancer Account Required</h2>
        <p className="mt-2 text-sm text-slate-600">
          Only freelancer accounts can create and publish catalog service packages. Use the role switcher in the top navigation bar to switch your account role.
        </p>
        <div className="mt-6">
          <Link href="/gigs" className="btn-primary !text-xs !py-2.5 !px-5 shadow-ochre">
            Browse Services Catalog
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description,
          cover_image:
            coverImage.trim() ||
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          packages: {
            basic: {
              name: "basic",
              title: basicTitle,
              description: basicDesc,
              price_etb: Number(basicPrice),
              delivery_days: Number(basicDays),
              revisions: Number(basicRevisions),
              features: basicFeatures.split(",").map((f) => f.trim()).filter(Boolean),
            },
            standard: {
              name: "standard",
              title: stdTitle,
              description: stdDesc,
              price_etb: Number(stdPrice),
              delivery_days: Number(stdDays),
              revisions: Number(stdRevisions),
              features: stdFeatures.split(",").map((f) => f.trim()).filter(Boolean),
            },
            premium: {
              name: "premium",
              title: premTitle,
              description: premDesc,
              price_etb: Number(premPrice),
              delivery_days: Number(premDays),
              revisions: Number(premRevisions),
              features: premFeatures.split(",").map((f) => f.trim()).filter(Boolean),
            },
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish service");

      router.push(`/gigs/${data.gig.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/gigs"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Services Marketplace</span>
      </Link>

      {/* Header Banner */}
      <div className="mt-4 flex flex-col justify-between gap-4 border-b border-slate-200 pb-8 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand-dark">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>Three-tier service catalog</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Publish a New Service Offering
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600">
            Define fixed-scope packages with clear deliverables, pricing, revision rounds, and delivery timing.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-left text-xs">
            <p className="font-bold text-slate-900">Clear expectations</p>
            <p className="text-[11px] text-slate-500">Show buyers exactly what is included</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Basic Overview */}
        <div className="card-surface space-y-5 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand-dark">
              1
            </div>
            <h2 className="text-base font-bold text-slate-900">Service Overview</h2>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Service Title <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. build a high-performance Next.js web application with Telebirr payment"
              className="input-field mt-1.5"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Action-oriented headline. We prepend &quot;I will&quot; automatically if omitted.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Specialization / Category <span className="text-brand">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field mt-1.5"
              >
                {GIG_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-white text-slate-800">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Cover Image URL (Optional)
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="input-field mt-1.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Service Description &amp; Detailed Deliverables <span className="text-brand">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain your approach, tech stack, what the client receives, and what is required to start..."
              className="input-field mt-1.5 min-h-[140px] text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Keywords &amp; Skill Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Next.js, Telebirr API, Flutter, Figma, Full-Stack"
              className="input-field mt-1.5"
            />
          </div>
        </div>

        {/* 3-Tier Packages Matrix */}
        <div className="card-surface space-y-6 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand-dark">
              2
            </div>
            <h2 className="text-base font-bold text-slate-900">Pricing &amp; 3-Tier Packages</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Basic Tier */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
              <span className="badge-brand">
                Basic Tier
              </span>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Package Title</label>
                <input
                  type="text"
                  value={basicTitle}
                  onChange={(e) => setBasicTitle(e.target.value)}
                  className="input-field mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Short Summary</label>
                <input
                  type="text"
                  value={basicDesc}
                  onChange={(e) => setBasicDesc(e.target.value)}
                  className="input-field mt-1 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Price (ETB)</label>
                  <input
                    type="number"
                    value={basicPrice}
                    onChange={(e) => setBasicPrice(Number(e.target.value))}
                    className="input-field mt-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Days</label>
                  <input
                    type="number"
                    value={basicDays}
                    onChange={(e) => setBasicDays(Number(e.target.value))}
                    className="input-field mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Revisions</label>
                  <input
                    type="number"
                    value={basicRevisions}
                    onChange={(e) => setBasicRevisions(Number(e.target.value))}
                    className="input-field mt-1 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Included Features (comma-separated)</label>
                <input
                  type="text"
                  value={basicFeatures}
                  onChange={(e) => setBasicFeatures(e.target.value)}
                  className="input-field mt-1 text-xs"
                />
              </div>
            </div>

            {/* Standard Tier */}
            <div className="rounded-2xl border border-brand/30 bg-amber-50/30 p-5 space-y-3 relative shadow-sm">
              <span className="badge-brand">
                Standard Tier
              </span>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Package Title</label>
                <input
                  type="text"
                  value={stdTitle}
                  onChange={(e) => setStdTitle(e.target.value)}
                  className="input-field mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Short Summary</label>
                <input
                  type="text"
                  value={stdDesc}
                  onChange={(e) => setStdDesc(e.target.value)}
                  className="input-field mt-1 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Price (ETB)</label>
                  <input
                    type="number"
                    value={stdPrice}
                    onChange={(e) => setStdPrice(Number(e.target.value))}
                    className="input-field mt-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Days</label>
                  <input
                    type="number"
                    value={stdDays}
                    onChange={(e) => setStdDays(Number(e.target.value))}
                    className="input-field mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Revisions</label>
                  <input
                    type="number"
                    value={stdRevisions}
                    onChange={(e) => setStdRevisions(Number(e.target.value))}
                    className="input-field mt-1 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Included Features (comma-separated)</label>
                <input
                  type="text"
                  value={stdFeatures}
                  onChange={(e) => setStdFeatures(e.target.value)}
                  className="input-field mt-1 text-xs"
                />
              </div>
            </div>

            {/* Premium Tier */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
              <span className="badge-brand">
                Premium Tier
              </span>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Package Title</label>
                <input
                  type="text"
                  value={premTitle}
                  onChange={(e) => setPremTitle(e.target.value)}
                  className="input-field mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Short Summary</label>
                <input
                  type="text"
                  value={premDesc}
                  onChange={(e) => setPremDesc(e.target.value)}
                  className="input-field mt-1 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Price (ETB)</label>
                  <input
                    type="number"
                    value={premPrice}
                    onChange={(e) => setPremPrice(Number(e.target.value))}
                    className="input-field mt-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Days</label>
                  <input
                    type="number"
                    value={premDays}
                    onChange={(e) => setPremDays(Number(e.target.value))}
                    className="input-field mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Revisions</label>
                  <input
                    type="number"
                    value={premRevisions}
                    onChange={(e) => setPremRevisions(Number(e.target.value))}
                    className="input-field mt-1 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Included Features (comma-separated)</label>
                <input
                  type="text"
                  value={premFeatures}
                  onChange={(e) => setPremFeatures(e.target.value)}
                  className="input-field mt-1 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/gigs"
            className="btn-secondary !text-xs font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary !py-3.5 !px-8 text-xs sm:text-sm font-bold shadow-ochre"
          >
            {saving ? "Publishing Offering..." : "Publish Service Offering"}
          </button>
        </div>
      </form>
    </div>
  );
}
