"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  PlusCircle, 
  CheckCircle2, 
  X, 
  Tag, 
  Layers, 
  Plus 
} from "lucide-react";
import { JOB_CATEGORIES, CUSTOM_CATEGORY_LABEL, getSkillsForCategory } from "@/lib/categories";
import { useSession } from "@/components/SessionProvider";
import { formatEtb } from "@/lib/utils";

const BUDGET_PRESETS = [2500, 5000, 15000, 35000, 75000];

export default function NewJobPage() {
  const router = useRouter();
  const { user, loading } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(JOB_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [budget, setBudget] = useState("10000");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Authenticated user guard
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Dynamically retrieve skills tailored to the chosen category
  const suggestedSkills = useMemo(() => {
    return getSkillsForCategory(category);
  }, [category]);

  // Skill management functions
  function toggleSkill(skill: string) {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills((prev) => prev.filter((s) => s !== skill));
    } else {
      if (selectedSkills.length >= 20) {
        setError("Maximum of 20 target skills allowed per project brief.");
        return;
      }
      setError("");
      setSelectedSkills((prev) => [...prev, skill]);
    }
  }

  function removeSkill(skillToRemove: string) {
    setSelectedSkills((prev) => prev.filter((s) => s !== skillToRemove));
  }

  function handleAddCustomSkill(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const clean = customSkillInput.trim();
    if (!clean) return;
    if (selectedSkills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setCustomSkillInput("");
      return;
    }
    if (selectedSkills.length >= 20) {
      setError("Maximum of 20 target skills allowed per project brief.");
      return;
    }
    setError("");
    setSelectedSkills((prev) => [...prev, clean]);
    setCustomSkillInput("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please provide a title and detailed description.");
      return;
    }

    let finalCategory = category;
    if (category === CUSTOM_CATEGORY_LABEL) {
      if (!customCategory.trim()) {
        setError("Please enter the name of your custom category domain.");
        return;
      }
      finalCategory = customCategory.trim();
    }

    const budgetNum = Number(budget);
    if (isNaN(budgetNum) || budgetNum < 100) {
      setError("Minimum budget is 100 ETB.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: finalCategory,
          budget_etb: budgetNum,
          skills: selectedSkills,
        }),
      });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) {
        setError(data.error || "Failed to publish job");
        return;
      }
      router.push(`/jobs/${data.job.id}`);
    } catch {
      setBusy(false);
      setError("Network or server error. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Project Requests</span>
      </Link>

      {/* Header Banner */}
      <div className="mt-4 flex flex-col justify-between gap-4 border-b border-slate-200 pb-8 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand-dark">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>Project Brief &amp; RFP</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Post an Open Project Request
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600">
            Select your project domain, define milestones, and list targeted skills to receive verified solution pitches from Ethiopian professionals.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-left text-xs">
            <p className="font-bold text-slate-900">The Muday Vault</p>
            <p className="text-[11px] text-slate-500">Funds protected until approval</p>
          </div>
        </div>
      </div>

      {user && user.role === "freelancer" && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          <p className="font-bold">Notice: You are signed in as a Specialist / Freelancer.</p>
          <p className="mt-1">
            Projects are posted by hiring clients. You can still test this brief form, or switch your active workspace in Settings.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Card 1: Job Details */}
          <div className="card-surface space-y-5 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand-dark">
                1
              </div>
              <h2 className="text-base font-bold text-slate-900">Project Scope &amp; Specialization</h2>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Job Headline / Title <span className="text-brand">*</span>
              </label>
              <input
                className="input-field mt-1.5"
                placeholder="e.g. Modern Web Application with Telebirr Escrow & Identity"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Be specific and descriptive so qualified Ethiopian specialists discover your project quickly.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Specialization Category <span className="text-brand">*</span></span>
                  <span className="text-[10px] text-brand font-medium lowercase">({JOB_CATEGORIES.length} options)</span>
                </label>
                <div className="relative mt-1.5">
                  <select
                    className="input-field cursor-pointer font-medium"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setError("");
                    }}
                  >
                    {JOB_CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-white text-slate-800">
                        {c === CUSTOM_CATEGORY_LABEL ? `➕ ${c} (Specify Domain)` : c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Project Budget (ETB) <span className="text-brand">*</span>
                </label>
                <div className="relative mt-1.5">
                  <input
                    className="input-field pr-16 font-mono font-bold"
                    type="number"
                    min={100}
                    step={100}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand">
                    ETB
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Category Input if "Custom / Other" is chosen */}
            {category === CUSTOM_CATEGORY_LABEL && (
              <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-brand" />
                  <span>Specify Custom Domain / Industry <span className="text-brand">*</span></span>
                </label>
                <input
                  className="input-field bg-white"
                  placeholder="e.g. Agricultural Tech / Drone Surveying / 3D Architecture CAD"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Enter your unique field so professionals with matching cross-functional experience can apply.
                </p>
              </div>
            )}

            {/* Quick Budget Presets */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Quick Budget Presets:
              </label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {BUDGET_PRESETS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBudget(String(val))}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      budget === String(val)
                        ? "bg-brand text-white shadow-ochre font-bold"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-brand/40 hover:text-slate-900"
                    }`}
                  >
                    {formatEtb(val)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Detailed Scope &amp; Deliverables <span className="text-brand">*</span>
              </label>
              <textarea
                className="input-field mt-1.5 min-h-[160px] text-xs leading-relaxed"
                placeholder="Describe project objectives, key features, expected milestone deliverables, timeline expectations, and any references..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Provide as much context as possible. You can negotiate phased milestones with applicants later.
              </p>
            </div>
          </div>

          {/* Card 2: Required Skills (Dynamically Associated to Selected Category) */}
          <div className="card-surface space-y-5 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand-dark">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Required Skills &amp; Tech Stack</h2>
                  <p className="text-[11px] text-slate-500">
                    Tailored to <span className="font-semibold text-slate-800">{category}</span>
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {selectedSkills.length} selected
              </span>
            </div>

            {/* Active Selected Skills Chips */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Selected Skills for this Project:
              </label>
              {selectedSkills.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-400">
                  No skills selected yet. Click the suggested tags below or type custom skills.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand-dark shadow-sm transition hover:bg-brand/15"
                    >
                      <Tag className="h-3 w-3 text-brand" />
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 rounded-full p-0.5 text-brand hover:bg-brand hover:text-white transition"
                        title={`Remove ${skill}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {selectedSkills.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedSkills([])}
                      className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition self-center ml-1"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic Category Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Recommended Skills for {category}:
                </p>
                <span className="text-[10px] text-slate-400">Click to add/remove</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? "border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm"
                          : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-brand/40 hover:bg-brand/5 hover:text-brand-dark"
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <PlusCircle className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Skill Input */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Add Custom / Specialized Skill:
              </label>
              <div className="flex gap-2">
                <input
                  className="input-field"
                  placeholder="Type any skill or tool (e.g. WebSockets, EthSwitch, PyTorch)..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomSkill()}
                  className="btn-secondary !py-2.5 !px-4 text-xs font-bold shrink-0 inline-flex items-center gap-1.5 hover:border-brand hover:text-brand"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Press Enter or click Add to append specialized libraries, platforms, or tools.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/jobs"
              className="btn-secondary !text-xs font-semibold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary !py-3.5 !px-8 text-xs sm:text-sm font-bold shadow-ochre"
            >
              {busy ? "Publishing Project..." : "Publish Project Request"}
            </button>
          </div>
        </div>

        {/* Right Sidebar: Helpful Guidance */}
        <div className="space-y-6">
          <div className="card-surface rounded-3xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-2 text-brand">
              <Zap className="h-4 w-4" />
              <h3 className="text-sm font-bold text-slate-900">How Project RFPs Work</h3>
            </div>
            <ul className="mt-4 space-y-3.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand-dark">
                  1
                </div>
                <span>
                  <strong className="text-slate-900">Post Listing:</strong> Your project request is published to the sovereign Muday-Freelance marketplace.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand-dark">
                  2
                </div>
                <span>
                  <strong className="text-slate-900">Receive Proposals:</strong> Verified specialists submit their price, delivery timeline, and solution pitch.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand-dark">
                  3
                </div>
                <span>
                  <strong className="text-slate-900">Fund Milestones:</strong> Agree on deliverables and lock funds in The Muday Vault. Funds are protected until you approve.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand-dark">
                  4
                </div>
                <span>
                  <strong className="text-slate-900">Instant Release:</strong> Once milestones are verified, payout is released immediately to the specialist&apos;s Telebirr account.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-6 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-900">💡 Tip for Hiring Clients</h4>
            <p className="leading-relaxed">
              Choosing exact technical skills helps our search algorithm highlight your project to specialists whose verified badges match your exact requirements.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
