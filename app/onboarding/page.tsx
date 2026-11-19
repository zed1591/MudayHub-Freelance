"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Award,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FolderGit2,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { calculateProfileStrength } from "@/lib/profile-strength";
import { 
  JOB_CATEGORIES, 
  GIG_CATEGORIES, 
  type CertificationItem, 
  type EducationItem, 
  type PastProject 
} from "@/lib/types";

const FREELANCER_PRESET_SKILLS = [
  "React / Next.js",
  "Node.js / Express",
  "Python / Django",
  "Flutter / Mobile",
  "UI/UX Design (Figma)",
  "Tailwind CSS",
  "PostgreSQL / SQL",
  "API Development",
  "Graphic & Brand Design",
  "Amharic & English Translation",
  "Cybersecurity Audit",
  "Docker & DevOps",
  "Content Writing",
  "AI & Data Analysis",
];

const CLIENT_PRESET_CATEGORIES = Array.from(
  new Set([...GIG_CATEGORIES, ...JOB_CATEGORIES])
);

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refresh } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [error, setError] = useState("");

  // Base profile fields
  const [headline, setHeadline] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [phone, setPhone] = useState("");
  const [telebirr, setTelebirr] = useState("");

  // Links & Open-Source Presence
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Structured Credentials & Past Work
  const [pastProjects, setPastProjects] = useState<PastProject[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);

  // Inline Quick-Add states for past projects
  const [showAddProject, setShowAddProject] = useState(false);
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projLink, setProjLink] = useState("");
  const [projTags, setProjTags] = useState("");

  // Inline Quick-Add states for education / certs
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [credType, setCredType] = useState<"education" | "certification">("education");
  const [credName, setCredName] = useState("");
  const [credOrg, setCredOrg] = useState("");
  const [credYear, setCredYear] = useState("");
  const [credField, setCredField] = useState("");
  const [credUrl, setCredUrl] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.push("/login");
          return;
        }
        const p = d.user.profile;
        setHeadline(p.headline || "");
        setAvatarUrl(p.avatar_url || "");
        setBio(p.bio || "");
        setSelectedCategories(p.skills || []);
        setPhone(p.phone || "");
        setTelebirr(p.telebirr_number || "");
        setGithubUrl(p.github_url || "");
        setPortfolioUrl(p.portfolio_url || "");
        setLinkedinUrl(p.linkedin_url || "");
        setPastProjects(p.past_projects || []);
        setEducation(p.education || []);
        setCertifications(p.certifications || []);
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="glass-card h-64 w-full max-w-xl animate-pulse rounded-3xl" />
      </div>
    );
  }

  const isFreelancer = user.role === "freelancer";

  // Unified profile strength calculation
  const strengthPercent = calculateProfileStrength({
    role: user.role,
    fullName: user.full_name,
    headline,
    bio,
    skills: selectedCategories,
    phone,
    telebirr,
    avatarUrl,
    githubUrl,
    portfolioUrl,
    linkedinUrl,
    pastProjects,
    education,
    certifications,
  });

  async function handleToggleRole() {
    setSwitchingRole(true);
    setError("");
    const newRole = isFreelancer ? "client" : "freelancer";
    try {
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to switch role");
      }
      await refresh();
      setSelectedCategories([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to switch account type");
    } finally {
      setSwitchingRole(false);
    }
  }

  function toggleCategory(cat: string) {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      if (selectedCategories.length >= 20) {
        setError("You can select up to 20 preferred categories and skills.");
        return;
      }
      setError("");
      setSelectedCategories([...selectedCategories, cat]);
    }
  }

  function addCustomSkill() {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (selectedCategories.includes(trimmed)) {
      setCustomSkillInput("");
      return;
    }
    if (selectedCategories.length >= 20) {
      setError("Maximum of 20 preferences reached.");
      return;
    }
    setSelectedCategories([...selectedCategories, trimmed]);
    setCustomSkillInput("");
    setError("");
  }

  function removeCategory(cat: string) {
    setSelectedCategories(selectedCategories.filter((c) => c !== cat));
  }

  function handleAddQuickProject() {
    if (!projTitle.trim()) {
      setError("Please provide a project title");
      return;
    }
    const tagsArray = projTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const newProj: PastProject = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 9),
      title: projTitle.trim(),
      description: projDesc.trim(),
      link: normalizeUrl(projLink),
      tags: tagsArray,
    };
    setPastProjects([...pastProjects, newProj]);
    setProjTitle("");
    setProjDesc("");
    setProjLink("");
    setProjTags("");
    setShowAddProject(false);
    setError("");
  }

  function handleRemoveProject(id?: string) {
    if (!id) return;
    setPastProjects(pastProjects.filter((p) => p.id !== id));
  }

  function handleAddQuickCredential() {
    if (!credOrg.trim() || !credName.trim()) {
      setError("Please fill in the credential name and institution/issuer.");
      return;
    }
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 9);
    if (credType === "education") {
      const newEdu: EducationItem = {
        id,
        institution: credOrg.trim(),
        degree: credName.trim(),
        field: credField.trim() || credName.trim(),
        year: credYear.trim() || "Completed",
      };
      setEducation([...education, newEdu]);
    } else {
      const newCert: CertificationItem = {
        id,
        name: credName.trim(),
        issuer: credOrg.trim(),
        year: credYear.trim() || undefined,
        credential_url: normalizeUrl(credUrl),
      };
      setCertifications([...certifications, newCert]);
    }
    setCredName("");
    setCredOrg("");
    setCredYear("");
    setCredField("");
    setCredUrl("");
    setShowAddCredential(false);
    setError("");
  }

  function handleRemoveEducation(id?: string) {
    if (!id) return;
    setEducation(education.filter((e) => e.id !== id));
  }

  function handleRemoveCertification(id?: string) {
    if (!id) return;
    setCertifications(certifications.filter((c) => c.id !== id));
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setError("");

    // Validate phone numbers if provided
    let cleanPhone = phone.trim();
    if (cleanPhone === "+2519" || cleanPhone === "+2517" || cleanPhone === "") {
      cleanPhone = "";
    } else if (!/^(\+2519|\+2517)\d{8}$/.test(cleanPhone)) {
      setError("Phone must match Ethiopian format: +2519xxxxxxxx or +2517xxxxxxxx");
      setSaving(false);
      return;
    }

    let cleanTelebirr = telebirr.trim();
    if (cleanTelebirr === "+2519" || cleanTelebirr === "+2517" || cleanTelebirr === "") {
      cleanTelebirr = "";
    } else if (!/^(\+2519|\+2517)\d{8}$/.test(cleanTelebirr)) {
      setError("Telebirr payout number must match: +2519xxxxxxxx or +2517xxxxxxxx");
      setSaving(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        skills: selectedCategories,
        bio: bio.trim(),
        phone: cleanPhone || undefined,
      };

      if (avatarUrl.trim()) {
        payload.avatar_url = normalizeUrl(avatarUrl);
      }

      if (isFreelancer) {
        payload.headline = headline.trim() || undefined;
        payload.github_url = normalizeUrl(githubUrl);
        payload.portfolio_url = normalizeUrl(portfolioUrl);
        payload.linkedin_url = normalizeUrl(linkedinUrl);
        payload.past_projects = pastProjects;
        payload.education = education;
        payload.certifications = certifications;
        if (cleanTelebirr) {
          payload.telebirr_number = cleanTelebirr;
        }
      }

      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile details");
      }

      await refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/30 bg-surface-raised p-2 shadow-sm">
          <Image
            src="/logo-emblem.png"
            alt="MudayHub"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-orange-50 px-3.5 py-1 text-xs font-bold text-brand-dark">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          <span>Newcomer Profile Setup</span>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {isFreelancer
            ? "Build Your MudayHub Specialist Profile"
            : "Welcome! Tailor Your Marketplace Hiring Feed"}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          {isFreelancer
            ? "Highlight your technical strengths, portfolio links, past projects, and credentials. All fields are optional and can be updated anytime in your Dashboard."
            : "Tell us your hiring focus and required capabilities. We will curate top verified Ethiopian specialists and tailored packages directly into your dashboard."}
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-50 p-4 text-xs font-semibold text-rose-700 text-center">
          {error}
        </div>
      )}

      {/* Account Type Confirmation & Switcher Bar */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm shrink-0">
            {isFreelancer ? <UserCheck className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Current Account Role
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              {isFreelancer ? "Freelancer / Specialist" : "Client / Hiring Business"}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={switchingRole}
          onClick={handleToggleRole}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand/30 bg-white px-3.5 py-2 text-xs font-bold text-brand hover:bg-orange-50 transition shadow-sm cursor-pointer"
        >
          {switchingRole ? (
            <span>Switching mode…</span>
          ) : (
            <>
              <span>Switch to {isFreelancer ? "Client / Business" : "Freelancer / Specialist"}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Freelancer Profile Completeness Meter */}
      {isFreelancer && (
        <div className="mt-6 rounded-2xl border border-brand/20 bg-gradient-to-r from-orange-50 via-amber-50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand" />
              <span>Profile Strength Meter</span>
            </span>
            <span className="text-brand-dark font-extrabold">{strengthPercent}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(15, strengthPercent)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
            {strengthPercent >= 80
              ? "🌟 Excellent! Your profile has rich credentials and portfolio proof that attract top client proposals."
              : "💡 Tip: Adding a past project, GitHub link, or degree significantly boosts client trust and profile ranking."}
          </p>
        </div>
      )}

      {/* Main Preferences Card */}
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-8">
        {/* Step 1: Category & Skill Preferences */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              {isFreelancer ? (
                <>
                  <UserCheck className="h-4 w-4 text-brand" />
                  <span>Your Specialties &amp; Core Skills ({selectedCategories.length} selected)</span>
                </>
              ) : (
                <>
                  <Briefcase className="h-4 w-4 text-brand" />
                  <span>Categories You Plan to Hire ({selectedCategories.length} selected)</span>
                </>
              )}
            </label>
            <span className="text-[11px] text-slate-400">Click to toggle</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(isFreelancer ? FREELANCER_PRESET_SKILLS : CLIENT_PRESET_CATEGORIES).map((item) => {
              const active = selectedCategories.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleCategory(item)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    active
                      ? "bg-brand text-white shadow-ochre border border-brand"
                      : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>

          {/* Add custom skill/tag */}
          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              Add any custom skill, tool, or specialization (e.g. Next.js, Django, Solidity, Amharic Translation):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a skill..."
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
                className="input-field !py-2 !text-xs max-w-xs"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="btn-secondary !rounded-xl !px-3 !py-2 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Display currently selected tags */}
          {selectedCategories.length > 0 && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1.5">
                Active Skills &amp; Filters:
              </span>
              {selectedCategories.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCategory(c)}
                    className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Headline, Avatar & Bio */}
        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-1">
              Profile Photo URL (Optional)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Add a headshot image URL (GitHub avatar, Unsplash, or photo link) to build immediate client trust.
            </p>
            <input
              type="text"
              className="input-field !py-2.5 !text-xs font-mono"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          {isFreelancer && (
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-1">
                Professional Headline (Optional)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                A punchy tagline displayed next to your name across search, job pitches, and your public profile.
              </p>
              <input
                type="text"
                maxLength={140}
                className="input-field !py-2.5 !text-xs"
                placeholder="e.g. Senior Full-Stack Engineer | React, Node.js & Cloud Architecture"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-1">
              {isFreelancer ? "Bio & Overview (Optional)" : "Organization & Hiring Overview (Optional)"}
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              {isFreelancer
                ? "Describe your background, core competencies, and the value you deliver to clients."
                : "Help freelancers understand your company culture, project expectations, and communication style."}
            </p>
            <textarea
              rows={3}
              className="input-field !py-2.5 !text-xs leading-relaxed"
              placeholder={
                isFreelancer
                  ? "e.g., Software engineer based in Addis Ababa with 4+ years building high-traffic web applications, REST/GraphQL APIs, and mobile solutions for businesses."
                  : "e.g., Fast-growing Ethiopian technology enterprise building logistics and mobile services. We frequently collaborate with skilled independent specialists."
              }
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </div>

        {/* Step 3: Freelancer Social & Open-Source Links (Freelancer only) */}
        {isFreelancer && (
          <div className="space-y-3 border-t border-slate-100 pt-6">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Online Presence &amp; Open-Source Links (Optional)
              </label>
              <p className="text-[11px] text-slate-500">
                Share your GitHub, personal portfolio, or LinkedIn to build immediate client trust.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1">
                  <Github className="h-3.5 w-3.5 text-slate-800" />
                  <span>GitHub Profile</span>
                </label>
                <input
                  type="text"
                  placeholder="github.com/username"
                  className="input-field !py-2 !text-xs"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1">
                  <Globe className="h-3.5 w-3.5 text-brand" />
                  <span>Portfolio / Website</span>
                </label>
                <input
                  type="text"
                  placeholder="https://yourname.dev"
                  className="input-field !py-2 !text-xs"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1">
                  <Linkedin className="h-3.5 w-3.5 text-sky-700" />
                  <span>LinkedIn Profile</span>
                </label>
                <input
                  type="text"
                  placeholder="linkedin.com/in/username"
                  className="input-field !py-2 !text-xs"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Showcase Past Projects Done Before (Freelancer only) */}
        {isFreelancer && (
          <div className="space-y-3 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  <FolderGit2 className="h-4 w-4 text-brand" />
                  <span>Past Projects Done Before (Optional)</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Showcase projects you have previously completed to prove your hands-on experience.
                </p>
              </div>

              {!showAddProject && (
                <button
                  type="button"
                  onClick={() => setShowAddProject(true)}
                  className="btn-secondary !rounded-xl !px-3 !py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Project</span>
                </button>
              )}
            </div>

            {/* Existing project list */}
            {pastProjects.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {pastProjects.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{p.title}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(p.id)}
                          className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {p.description && (
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {p.tags?.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-brand hover:underline inline-flex items-center gap-0.5 shrink-0"
                        >
                          <span>Live</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick add project form */}
            {showAddProject && (
              <div className="rounded-2xl border border-brand/30 bg-orange-50/30 p-4 space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-brand" />
                  <span>Add a Completed Project</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      className="input-field !py-2 !text-xs"
                      placeholder="e.g. Retail Inventory Management PWA"
                      value={projTitle}
                      onChange={(e) => setProjTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Demo / Repo Link (Optional)
                    </label>
                    <input
                      type="text"
                      className="input-field !py-2 !text-xs"
                      placeholder="https://github.com/... or live URL"
                      value={projLink}
                      onChange={(e) => setProjLink(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Description &amp; Highlights
                  </label>
                  <textarea
                    rows={2}
                    className="input-field !py-2 !text-xs"
                    placeholder="Briefly describe what you built, architecture choices, or client outcomes..."
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tech Stack (Comma-separated)
                  </label>
                  <input
                    type="text"
                    className="input-field !py-2 !text-xs"
                    placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
                    value={projTags}
                    onChange={(e) => setProjTags(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddQuickProject}
                    className="btn-primary !rounded-xl !px-3.5 !py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Add This Project
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Education & Certifications (Freelancer only) */}
        {isFreelancer && (
          <div className="space-y-3 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  <GraduationCap className="h-4 w-4 text-brand" />
                  <span>Education &amp; Certifications (Optional)</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Add your university degree, diploma, or industry recognitions (AWS, Cisco, Google, etc.).
                </p>
              </div>

              {!showAddCredential && (
                <button
                  type="button"
                  onClick={() => setShowAddCredential(true)}
                  className="btn-secondary !rounded-xl !px-3 !py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Credential</span>
                </button>
              )}
            </div>

            {/* List of current education & certs */}
            {(education.length > 0 || certifications.length > 0) && (
              <div className="space-y-2 pt-1">
                {education.map((edu) => (
                  <div
                    key={edu.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-brand">
                        <GraduationCap className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {edu.degree} {edu.field && `in ${edu.field}`}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {edu.institution} {edu.year && `• ${edu.year}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(edu.id)}
                      className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <Award className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{cert.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {cert.issuer} {cert.year && `• ${cert.year}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(cert.id)}
                      className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick add credential form */}
            {showAddCredential && (
              <div className="rounded-2xl border border-brand/30 bg-orange-50/30 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 border-b border-orange-200/50 pb-2">
                  <span className="text-xs font-bold text-slate-800">Credential Type:</span>
                  <button
                    type="button"
                    onClick={() => setCredType("education")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      credType === "education"
                        ? "bg-brand text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Degree / Academic
                  </button>
                  <button
                    type="button"
                    onClick={() => setCredType("certification")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      credType === "certification"
                        ? "bg-brand text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Industry Certification
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {credType === "education" ? "Degree / Diploma *" : "Certification Name *"}
                    </label>
                    <input
                      type="text"
                      className="input-field !py-2 !text-xs"
                      placeholder={credType === "education" ? "e.g. B.Sc. in Computer Science" : "e.g. AWS Certified Solutions Architect"}
                      value={credName}
                      onChange={(e) => setCredName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {credType === "education" ? "University / College *" : "Issuing Organization *"}
                    </label>
                    <input
                      type="text"
                      className="input-field !py-2 !text-xs"
                      placeholder={credType === "education" ? "e.g. Addis Ababa University" : "e.g. Amazon Web Services"}
                      value={credOrg}
                      onChange={(e) => setCredOrg(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Graduation / Completion Year
                    </label>
                    <input
                      type="text"
                      className="input-field !py-2 !text-xs"
                      placeholder="e.g. 2024"
                      value={credYear}
                      onChange={(e) => setCredYear(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {credType === "education" ? "Field of Study" : "Credential Verification Link"}
                    </label>
                    <input
                      type="text"
                      className="input-field !py-2 !text-xs"
                      placeholder={credType === "education" ? "e.g. Software Engineering" : "https://www.credly.com/..."}
                      value={credType === "education" ? credField : credUrl}
                      onChange={(e) => (credType === "education" ? setCredField(e.target.value) : setCredUrl(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCredential(false)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddQuickCredential}
                    className="btn-primary !rounded-xl !px-3.5 !py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Add Credential
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Contact & Payout Phone */}
        <div className="space-y-2 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
              {isFreelancer ? "Telebirr Payout Phone (Optional)" : "Contact Phone Number (Optional)"}
            </label>
            <span className="text-[10px] text-emerald-700 font-semibold">
              {isFreelancer ? "Used for escrow payout releases" : "For account verification"}
            </span>
          </div>
          <input
            type="text"
            className="input-field !py-2.5 !text-xs font-mono max-w-sm"
            placeholder="+251911223344"
            value={isFreelancer ? telebirr : phone}
            onChange={(e) => (isFreelancer ? setTelebirr(e.target.value) : setPhone(e.target.value))}
          />
          <p className="text-[10px] text-slate-500">
            Ethiopian mobile format (+2519xxxxxxxx or +2517xxxxxxxx). Can also be updated in Settings anytime.
          </p>
        </div>

        {/* Payment Protection Callout */}
        <div className="rounded-2xl border border-emerald-600/20 bg-emerald-50 p-4 text-xs text-slate-700 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-emerald-900">
              100% Milestone-Based Muday Vault Escrow Protection
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Every contract on MudayHub is secured in ETB escrow before work starts. Freelancers are guaranteed payment upon deliverable release, and clients review work before releasing funds.
            </p>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition order-2 sm:order-1 cursor-pointer"
          >
            Skip for now → Complete later in Settings
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave()}
            className="btn-primary w-full sm:w-auto !px-6 !py-3 font-bold text-xs shadow-ochre flex items-center justify-center gap-2 order-1 sm:order-2 cursor-pointer"
          >
            {saving ? (
              <span>Saving Profile…</span>
            ) : (
              <>
                <span>Save Profile &amp; Launch Marketplace Feed</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
