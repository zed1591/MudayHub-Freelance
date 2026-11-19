"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { calculateProfileStrength } from "@/lib/profile-strength";
import { 
  ShieldCheck, 
  FolderGit2, 
  Briefcase, 
  GraduationCap, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Github, 
  Globe, 
  Linkedin,
  CheckCircle2,
  Sparkles,
  Camera,
  Upload,
  Wallet,
  Building2,
  AlertTriangle,
  CreditCard
} from "lucide-react";
import type { 
  CertificationItem, 
  EducationItem, 
  ExperienceItem, 
  PastProject, 
  PaymentMethodItem, 
  PaymentMethodType, 
  Profile 
} from "@/lib/types";
import { ETHIOPIAN_BANKS } from "@/lib/types";

interface Props {
  profile: Profile | null;
  isClient: boolean;
  onSaved: (updated: Profile) => void;
  onRoleSwitch?: () => Promise<void>;
}

export function SettingsTab({
  profile,
  isClient,
  onSaved,
  onRoleSwitch,
}: Props) {
  // General Fields
  const fullName = profile?.full_name || "";
  const [headline, setHeadline] = useState(profile?.headline || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [skills, setSkills] = useState(profile?.skills ? profile.skills.join(", ") : "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [telebirr, setTelebirr] = useState(profile?.telebirr_number || "");

  // Avatar / Profile Photo
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Social / Links
  const [githubUrl, setGithubUrl] = useState(profile?.github_url || "");
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || "");

  // Structured Credentials
  const [pastProjects, setPastProjects] = useState<PastProject[]>(profile?.past_projects || []);
  const [experience, setExperience] = useState<ExperienceItem[]>(profile?.experience || []);
  const [education, setEducation] = useState<EducationItem[]>(profile?.education || []);
  const [certifications, setCertifications] = useState<CertificationItem[]>(profile?.certifications || []);

  // Payment & Payout Methods (automatically integrates primary Telebirr number if present)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>(() => {
    if (profile?.payment_methods && profile.payment_methods.length > 0) {
      return profile.payment_methods;
    }
    if (profile?.telebirr_number) {
      return [
        {
          id: "pm-telebirr-primary",
          type: "telebirr" as PaymentMethodType,
          title: "Primary Telebirr Wallet",
          account_identifier: profile.telebirr_number,
          is_default: true,
          created_at: profile.created_at || new Date().toISOString(),
        },
      ];
    }
    return [];
  });
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [pmType, setPmType] = useState<PaymentMethodType>("telebirr");
  const [pmIdentifier, setPmIdentifier] = useState("");
  const [pmBankName, setPmBankName] = useState<string>(ETHIOPIAN_BANKS[0]);
  const [pmAccountHolder, setPmAccountHolder] = useState("");
  const [pmIsDefault, setPmIsDefault] = useState(false);

  // Account Deletion (Danger Zone)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Inline Add Form Toggles
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjLink, setNewProjLink] = useState("");
  const [newProjTags, setNewProjTags] = useState("");

  const [showAddExp, setShowAddExp] = useState(false);
  const [newExpTitle, setNewExpTitle] = useState("");
  const [newExpCompany, setNewExpCompany] = useState("");
  const [newExpDuration, setNewExpDuration] = useState("");
  const [newExpDesc, setNewExpDesc] = useState("");

  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newEduInst, setNewEduInst] = useState("");
  const [newEduDegree, setNewEduDegree] = useState("");
  const [newEduField, setNewEduField] = useState("");
  const [newEduYear, setNewEduYear] = useState("");

  const [showAddCert, setShowAddCert] = useState(false);
  const [newCertName, setNewCertName] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [newCertYear, setNewCertYear] = useState("");
  const [newCertLink, setNewCertLink] = useState("");

  // Status
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Unified profile strength calculation
  const strengthPercent = calculateProfileStrength({
    role: profile?.role,
    fullName,
    headline,
    bio,
    skills,
    phone,
    telebirr,
    avatarUrl,
    githubUrl,
    portfolioUrl,
    linkedinUrl,
    pastProjects,
    education,
    certifications,
    paymentMethods,
  });

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true);
    setAvatarError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/profiles/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload avatar");
      setAvatarUrl(data.avatar_url);
      if (profile) onSaved({ ...profile, avatar_url: data.avatar_url });
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleAddPaymentMethod(e: React.FormEvent) {
    e.preventDefault();
    const trimmedIdent = pmIdentifier.trim();
    if (!trimmedIdent) return;

    const title =
      pmType === "telebirr"
        ? "Telebirr Mobile Wallet"
        : pmType === "cbe_birr"
        ? "CBE Birr Mobile Banking"
        : pmBankName;

    const newPm: PaymentMethodItem = {
      id: `pm-${Date.now()}`,
      type: pmType,
      title,
      account_identifier: trimmedIdent,
      bank_details:
        pmType === "bank_transfer"
          ? {
              bank_name: pmBankName,
              account_number: trimmedIdent,
              account_holder_name: pmAccountHolder.trim() || fullName,
            }
          : undefined,
      is_default: pmIsDefault || paymentMethods.length === 0,
      created_at: new Date().toISOString(),
    };

    const updated: PaymentMethodItem[] = (pmIsDefault || paymentMethods.length === 0)
      ? [...paymentMethods.map((m) => ({ ...m, is_default: false })), newPm]
      : [...paymentMethods, newPm];

    setPaymentMethods(updated);
    setPmIdentifier("");
    setPmAccountHolder("");
    setShowAddPayment(false);
  }

  function handleRemovePaymentMethod(id: string) {
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
  }

  function handleSetDefaultPaymentMethod(id: string) {
    setPaymentMethods((prev) =>
      prev.map((m) => ({ ...m, is_default: m.id === id }))
    );
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/profiles/me", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }
      window.location.href = "/login";
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjTitle.trim() || !newProjDesc.trim()) return;
    const item: PastProject = {
      id: `proj-${Date.now()}`,
      title: newProjTitle.trim(),
      description: newProjDesc.trim(),
      link: newProjLink.trim() || undefined,
      tags: newProjTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    setPastProjects((prev) => [...prev, item]);
    setNewProjTitle("");
    setNewProjDesc("");
    setNewProjLink("");
    setNewProjTags("");
    setShowAddProject(false);
  }

  function handleAddExp(e: React.FormEvent) {
    e.preventDefault();
    if (!newExpTitle.trim() || !newExpCompany.trim() || !newExpDuration.trim()) return;
    const item: ExperienceItem = {
      id: `exp-${Date.now()}`,
      title: newExpTitle.trim(),
      company: newExpCompany.trim(),
      duration: newExpDuration.trim(),
      description: newExpDesc.trim() || undefined,
    };
    setExperience((prev) => [...prev, item]);
    setNewExpTitle("");
    setNewExpCompany("");
    setNewExpDuration("");
    setNewExpDesc("");
    setShowAddExp(false);
  }

  function handleAddEdu(e: React.FormEvent) {
    e.preventDefault();
    if (!newEduInst.trim() || !newEduDegree.trim() || !newEduYear.trim()) return;
    const item: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: newEduInst.trim(),
      degree: newEduDegree.trim(),
      field: newEduField.trim() || newEduDegree.trim(),
      year: newEduYear.trim(),
    };
    setEducation((prev) => [...prev, item]);
    setNewEduInst("");
    setNewEduDegree("");
    setNewEduField("");
    setNewEduYear("");
    setShowAddEdu(false);
  }

  function handleAddCert(e: React.FormEvent) {
    e.preventDefault();
    if (!newCertName.trim() || !newCertIssuer.trim()) return;
    const item: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: newCertName.trim(),
      issuer: newCertIssuer.trim(),
      year: newCertYear.trim() || undefined,
      credential_url: newCertLink.trim() || undefined,
    };
    setCertifications((prev) => [...prev, item]);
    setNewCertName("");
    setNewCertIssuer("");
    setNewCertYear("");
    setNewCertLink("");
    setShowAddCert(false);
  }

  async function handleSaveAll(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setIsError(false);

    const skillList = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          bio: bio.trim(),
          skills: skillList,
          phone: phone.trim() || null,
          telebirr_number: telebirr.trim() || null,
          github_url: githubUrl.trim() || null,
          portfolio_url: portfolioUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          past_projects: pastProjects,
          experience,
          education,
          certifications,
          payment_methods: paymentMethods,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok) {
        setIsError(true);
        setMessage(data.error || "Failed to update profile");
        return;
      }

      setIsError(false);
      setMessage("Profile, portfolio, and payment methods updated successfully!");
      if (data.profile) {
        onSaved(data.profile);
      }
      setTimeout(() => setMessage(""), 4000);
    } catch {
      setSaving(false);
      setIsError(true);
      setMessage("Network error. Please try again.");
    }
  }

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="space-y-8">
      {/* Profile Strength Card (Freelancers) */}
      {!isClient && (
        <div className="rounded-3xl border border-c2sa-crimson/20 bg-gradient-to-r from-rose-500/10 via-c2sa-crimson/5 to-transparent p-6 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-c2sa-crimson">
              <Sparkles className="h-4 w-4 text-c2sa-crimson" />
              <span className="text-sm font-bold">
                Profile Completeness Score · {strengthPercent}%
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {strengthPercent >= 85
                ? "🌟 All-Star Showcase"
                : strengthPercent >= 50
                ? "👍 Good progress"
                : "🚀 Complete more sections to win client trust"}
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-c2sa-crimson to-rose-500 transition-all duration-500"
              style={{ width: `${strengthPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Account Mode & Telegram */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Current Platform Mode
            </span>
            <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
              {isClient ? "Client / Hiring Entity" : "Specialist / Freelancer"}
            </span>
          </div>
          {onRoleSwitch && (
            <button
              type="button"
              onClick={onRoleSwitch}
              className="btn-secondary !py-2 !px-3.5 !text-xs font-bold flex items-center gap-1.5 hover:border-c2sa-crimson hover:text-c2sa-crimson transition self-start cursor-pointer"
            >
              <span>Switch to {isClient ? "Specialist Mode" : "Client Mode"}</span>
            </button>
          )}
        </div>

        {/* Telegram Milestone Alerts */}
        <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white font-bold text-lg shrink-0">
              ✈️
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900 block">
                Telegram Milestone Alerts
              </span>
              <span className="text-xs text-sky-700">
                Instant alerts for The Muday Vault milestone actions.
              </span>
            </div>
          </div>
          <a
            href="https://t.me/MudayHubBot"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition shrink-0"
          >
            <span>@MudayHubBot</span>
          </a>
        </div>
      </div>

      {/* Main Edit Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Profile Photo / Avatar Card */}
        <div className="card-surface rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-c2sa-crimson/10 text-xs font-bold text-c2sa-crimson">
                <Camera className="h-4 w-4 text-c2sa-crimson" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Profile Photo &amp; Avatar
              </h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-3xl object-cover ring-2 ring-c2sa-crimson/30 shadow-md"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-c2sa-slate to-c2sa-slate-dark text-3xl font-black text-white shadow-md ring-2 ring-c2sa-crimson/20">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-c2sa !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploadingAvatar ? "Uploading Photo…" : "Upload New Photo"}</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Or paste direct image URL (e.g. Unsplash, GitHub Avatar, Gravatar):
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="input-field text-xs font-mono !py-2"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>

              {avatarError && (
                <p className="text-xs font-semibold text-rose-600">{avatarError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Professional Identity */}
        <div className="card-surface rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-c2sa-crimson/10 text-xs font-bold text-c2sa-crimson">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Professional Identity &amp; Contact
              </h3>
            </div>
            {profile?.id && (
              <Link
                href={`/profiles/${profile.id}`}
                target="_blank"
                className="text-xs font-bold text-c2sa-crimson hover:underline inline-flex items-center gap-1"
              >
                <span>Preview Public Profile</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Full Legal Name
              </label>
              <input
                className="input-field mt-1.5 opacity-70 bg-slate-50 cursor-not-allowed"
                value={fullName}
                disabled
              />
              <p className="mt-1 text-[10px] text-slate-500">Locked to account identity.</p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Professional Headline / Title
              </label>
              <input
                className="input-field mt-1.5"
                placeholder="e.g. Senior Full-Stack Engineer & Telebirr Integrator"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
              <p className="mt-1 text-[10px] text-slate-500">Displayed under your name on search listings.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Direct Mobile Phone (+251...)
              </label>
              <input
                className="input-field mt-1.5 font-mono"
                placeholder="+251911..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {!isClient && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Telebirr Payout Number (+251...)
                </label>
                <input
                  className="input-field mt-1.5 font-mono"
                  placeholder="+251911..."
                  value={telebirr}
                  onChange={(e) => setTelebirr(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Professional Bio &amp; Background
            </label>
            <textarea
              className="input-field mt-1.5 min-h-[90px] text-xs leading-relaxed"
              placeholder="Summarize your professional background, past clients, and key specialties..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Primary Skills &amp; Technologies (comma-separated)
            </label>
            <input
              className="input-field mt-1.5 text-xs"
              placeholder="e.g. Next.js, React Native, Telebirr API, Flutter, Figma, Python"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: Online Presence & Open-Source Links */}
        <div className="card-surface rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-c2sa-crimson/10 text-xs font-bold text-c2sa-crimson">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Links, Open-Source &amp; Portfolio Sites (Optional)
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5" />
                <span>GitHub / GitLab URL</span>
              </label>
              <input
                className="input-field mt-1.5 text-xs font-mono"
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-c2sa-crimson" />
                <span>Portfolio / Behance URL</span>
              </label>
              <input
                className="input-field mt-1.5 text-xs font-mono"
                placeholder="https://myportfolio.et"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Linkedin className="h-3.5 w-3.5 text-blue-600" />
                <span>LinkedIn Profile URL</span>
              </label>
              <input
                className="input-field mt-1.5 text-xs font-mono"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Completed Projects Showcase */}
        {!isClient && (
          <div className="card-surface rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-c2sa-crimson/10 text-xs font-bold text-c2sa-crimson">
                  <FolderGit2 className="h-4 w-4 text-c2sa-crimson" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Past Completed Projects ({pastProjects.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProject(!showAddProject)}
                className="btn-secondary !py-1.5 !px-3 text-xs font-bold flex items-center gap-1 cursor-pointer hover:border-c2sa-crimson hover:text-c2sa-crimson"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-3">
              {pastProjects.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{p.title}</span>
                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-c2sa-crimson hover:underline inline-flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          <span>Link</span>
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.tags?.map((t, i) => (
                        <span key={i} className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPastProjects(pastProjects.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 p-1 self-end sm:self-center cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {showAddProject && (
                <div className="rounded-2xl border border-c2sa-crimson/30 bg-rose-50/50 p-4 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900">Add Showcase Project</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="input-field bg-white"
                      placeholder="Project Title *"
                      value={newProjTitle}
                      onChange={(e) => setNewProjTitle(e.target.value)}
                    />
                    <input
                      className="input-field bg-white"
                      placeholder="Live or GitHub Link (https://...)"
                      value={newProjLink}
                      onChange={(e) => setNewProjLink(e.target.value)}
                    />
                  </div>
                  <textarea
                    className="input-field bg-white min-h-[60px]"
                    placeholder="Project Description & Achievements *"
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                  />
                  <input
                    className="input-field bg-white"
                    placeholder="Tech Tags (e.g. Next.js, Flutter, Telebirr API)"
                    value={newProjTags}
                    onChange={(e) => setNewProjTags(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddProject(false)}
                      className="btn-secondary !py-1.5 !px-3 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="btn-c2sa !py-1.5 !px-4 text-xs font-bold cursor-pointer"
                    >
                      Save Project
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Work Experience Timeline */}
        {!isClient && (
          <div className="card-surface rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-c2sa-crimson/10 text-xs font-bold text-c2sa-crimson">
                  <Briefcase className="h-4 w-4 text-c2sa-crimson" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Work Experience ({experience.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExp(!showAddExp)}
                className="btn-secondary !py-1.5 !px-3 text-xs font-bold flex items-center gap-1 cursor-pointer hover:border-c2sa-crimson hover:text-c2sa-crimson"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Role</span>
              </button>
            </div>

            <div className="space-y-3">
              {experience.map((exp, idx) => (
                <div
                  key={exp.id || idx}
                  className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 text-xs">{exp.title} · {exp.company}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{exp.duration}</p>
                    {exp.description && <p className="text-xs text-slate-600 mt-1">{exp.description}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExperience(experience.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 p-1 self-end sm:self-center cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {showAddExp && (
                <div className="rounded-2xl border border-c2sa-crimson/30 bg-rose-50/50 p-4 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900">Add Work Experience</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      className="input-field bg-white"
                      placeholder="Job Title *"
                      value={newExpTitle}
                      onChange={(e) => setNewExpTitle(e.target.value)}
                    />
                    <input
                      className="input-field bg-white"
                      placeholder="Company / Client *"
                      value={newExpCompany}
                      onChange={(e) => setNewExpCompany(e.target.value)}
                    />
                    <input
                      className="input-field bg-white"
                      placeholder="Duration (e.g. 2021 – Present) *"
                      value={newExpDuration}
                      onChange={(e) => setNewExpDuration(e.target.value)}
                    />
                  </div>
                  <textarea
                    className="input-field bg-white min-h-[60px]"
                    placeholder="Key responsibilities and achievements..."
                    value={newExpDesc}
                    onChange={(e) => setNewExpDesc(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddExp(false)}
                      className="btn-secondary !py-1.5 !px-3 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddExp}
                      className="btn-c2sa !py-1.5 !px-4 text-xs font-bold cursor-pointer"
                    >
                      Save Role
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 5: Degrees & Certifications */}
        {!isClient && (
          <div className="card-surface rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-c2sa-crimson/10 text-xs font-bold text-c2sa-crimson">
                  <GraduationCap className="h-4 w-4 text-c2sa-crimson" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Education &amp; Certifications
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEdu(!showAddEdu)}
                  className="btn-secondary !py-1.5 !px-3 text-xs font-bold flex items-center gap-1 cursor-pointer hover:border-c2sa-crimson hover:text-c2sa-crimson"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Degree</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCert(!showAddCert)}
                  className="btn-secondary !py-1.5 !px-3 text-xs font-bold flex items-center gap-1 cursor-pointer hover:border-c2sa-crimson hover:text-c2sa-crimson"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Cert</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Education List */}
              <div className="space-y-2">
                {education.map((edu, idx) => (
                  <div
                    key={edu.id || idx}
                    className="rounded-xl border border-slate-200 p-3 flex items-center justify-between bg-slate-50/50 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{edu.degree} · {edu.institution}</p>
                      <p className="text-[11px] text-slate-500">{edu.field} • Class of {edu.year}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEducation(education.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Certifications List */}
              <div className="space-y-2">
                {certifications.map((cert, idx) => (
                  <div
                    key={cert.id || idx}
                    className="rounded-xl border border-slate-200 p-3 flex items-center justify-between bg-slate-50/50 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{cert.name} · {cert.issuer}</p>
                      {cert.year && <p className="text-[11px] text-slate-500">Issued {cert.year}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {showAddEdu && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-3 space-y-2 text-xs">
                  <input
                    className="input-field bg-white"
                    placeholder="Institution (e.g. Addis Ababa University / AAU)"
                    value={newEduInst}
                    onChange={(e) => setNewEduInst(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input-field bg-white"
                      placeholder="Degree (e.g. B.Sc. in Software Eng)"
                      value={newEduDegree}
                      onChange={(e) => setNewEduDegree(e.target.value)}
                    />
                    <input
                      className="input-field bg-white"
                      placeholder="Graduation Year (e.g. 2022)"
                      value={newEduYear}
                      onChange={(e) => setNewEduYear(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddEdu(false)}
                      className="btn-secondary !py-1 !px-2 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddEdu}
                      className="btn-c2sa !py-1 !px-3 text-xs font-bold cursor-pointer"
                    >
                      Save Degree
                    </button>
                  </div>
                </div>
              )}

              {showAddCert && (
                <div className="rounded-xl border border-purple-300 bg-purple-50/50 p-3 space-y-2 text-xs">
                  <input
                    className="input-field bg-white"
                    placeholder="Certificate Name (e.g. AWS Solutions Architect)"
                    value={newCertName}
                    onChange={(e) => setNewCertName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input-field bg-white"
                      placeholder="Issuer (e.g. AWS / ALX / INSA)"
                      value={newCertIssuer}
                      onChange={(e) => setNewCertIssuer(e.target.value)}
                    />
                    <input
                      className="input-field bg-white"
                      placeholder="Year (e.g. 2023)"
                      value={newCertYear}
                      onChange={(e) => setNewCertYear(e.target.value)}
                    />
                  </div>
                  <input
                    className="input-field bg-white"
                    placeholder="Verification / Credential URL (Optional)"
                    value={newCertLink}
                    onChange={(e) => setNewCertLink(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCert(false)}
                      className="btn-secondary !py-1 !px-2 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCert}
                      className="btn-c2sa !py-1 !px-3 text-xs font-bold cursor-pointer"
                    >
                      Save Cert
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 6: Payment & Payout Rails */}
        <div className="card-surface rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Payment Methods &amp; Payout Rails ({paymentMethods.length})
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPayment(!showAddPayment)}
              className="btn-secondary !py-1.5 !px-3 text-xs font-bold flex items-center gap-1 cursor-pointer hover:border-c2sa-crimson hover:text-c2sa-crimson"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Payment Method</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
            {isClient
              ? "Saved domestic accounts for milestone escrow deposits and verified business clearances."
              : "Registered Ethiopian payment destinations for automated escrow milestone disbursements from The Muday Vault."}
          </p>

          <div className="space-y-3">
            {paymentMethods.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                No payment or payout methods added yet. Add your Telebirr, CBE Birr, or Commercial Bank account to receive disbursements.
              </div>
            ) : (
              paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-c2sa-crimson shrink-0 shadow-sm">
                      {pm.type === "telebirr" || pm.type === "cbe_birr" ? (
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Building2 className="h-5 w-5 text-c2sa-crimson" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{pm.title}</span>
                        {pm.is_default && (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[9px] font-bold">
                            Default Payout
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-mono mt-0.5">
                        {pm.account_identifier}
                      </p>
                      {pm.bank_details?.account_holder_name && (
                        <p className="text-[11px] text-slate-500">
                          Account Holder: {pm.bank_details.account_holder_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!pm.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultPaymentMethod(pm.id)}
                        className="text-xs text-slate-500 hover:text-c2sa-crimson font-semibold cursor-pointer underline"
                      >
                        Make Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePaymentMethod(pm.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Delete payment method"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Add Payment Method Form */}
            {showAddPayment && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50/40 p-4 space-y-3 text-xs animate-in fade-in">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-emerald-700" />
                  <span>Register New Payment Method / Payout Rail</span>
                </h4>

                {/* Rail Type Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPmType("telebirr")}
                    className={`rounded-xl border p-2.5 text-xs font-bold text-left cursor-pointer transition ${
                      pmType === "telebirr"
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Telebirr Mobile Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => setPmType("cbe_birr")}
                    className={`rounded-xl border p-2.5 text-xs font-bold text-left cursor-pointer transition ${
                      pmType === "cbe_birr"
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    CBE Birr Mobile Banking
                  </button>
                  <button
                    type="button"
                    onClick={() => setPmType("bank_transfer")}
                    className={`rounded-xl border p-2.5 text-xs font-bold text-left cursor-pointer transition ${
                      pmType === "bank_transfer"
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Ethiopian Bank Account
                  </button>
                </div>

                {/* Dynamic Inputs based on type */}
                {pmType === "bank_transfer" ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Select Ethiopian Commercial Bank *
                      </label>
                      <select
                        className="input-field bg-white"
                        value={pmBankName}
                        onChange={(e) => setPmBankName(e.target.value)}
                      >
                        {ETHIOPIAN_BANKS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Bank Account Number *
                        </label>
                        <input
                          type="text"
                          className="input-field bg-white font-mono"
                          placeholder="e.g. 1000123456789"
                          value={pmIdentifier}
                          onChange={(e) => setPmIdentifier(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Account Beneficiary Full Name *
                        </label>
                        <input
                          type="text"
                          className="input-field bg-white"
                          placeholder={fullName || "e.g. Abebe Kebede"}
                          value={pmAccountHolder}
                          onChange={(e) => setPmAccountHolder(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {pmType === "telebirr" ? "Telebirr Mobile Phone (+2519...)" : "CBE Birr Mobile Phone (+2519...)"} *
                    </label>
                    <input
                      type="text"
                      className="input-field bg-white font-mono"
                      placeholder="+251911223344"
                      value={pmIdentifier}
                      onChange={(e) => setPmIdentifier(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="set-default-pm"
                    checked={pmIsDefault}
                    onChange={(e) => setPmIsDefault(e.target.checked)}
                    className="h-4 w-4 accent-emerald-600 rounded"
                  />
                  <label htmlFor="set-default-pm" className="text-xs text-slate-700 cursor-pointer">
                    Set as default payout destination
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
                  <button
                    type="button"
                    onClick={() => setShowAddPayment(false)}
                    className="btn-secondary !py-1.5 !px-3 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPaymentMethod}
                    className="btn-c2sa !py-1.5 !px-4 text-xs font-bold cursor-pointer"
                  >
                    Add Payment Rail
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`rounded-2xl p-4 text-xs font-bold flex items-center gap-2 ${
              isError
                ? "border border-rose-300 bg-rose-50 text-rose-800"
                : "border border-emerald-300 bg-emerald-50 text-emerald-800"
            }`}
          >
            {isError ? (
              <ShieldCheck className="h-4 w-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {profile?.id ? (
            <Link
              href={`/profiles/${profile.id}`}
              className="btn-secondary !text-xs font-semibold hover:border-c2sa-crimson hover:text-c2sa-crimson"
            >
              View Public Showcase →
            </Link>
          ) : <div />}

          <button
            type="submit"
            disabled={saving}
            className="btn-c2sa !py-3.5 !px-8 text-xs sm:text-sm font-bold cursor-pointer"
          >
            {saving ? "Saving Changes…" : "Save Complete Profile & Rails"}
          </button>
        </div>
      </form>

      {/* Section 7: Danger Zone · Account Deletion */}
      <div className="rounded-3xl border border-rose-300/80 bg-rose-50/40 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wider">
              Danger Zone · Account Deletion
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              Permanently delete your account, portfolio, listings, and profile data from MudayHub.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-white p-4 text-xs text-slate-600 space-y-2">
          <p>
            <strong>Safety Escrow Protection:</strong> To safeguard freelancer milestones and client deposits, accounts with active or disputed escrow contracts cannot be deleted until contracts are concluded or funds released.
          </p>
        </div>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-xl border border-rose-400 bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm cursor-pointer"
          >
            Delete My Account…
          </button>
        ) : (
          <div className="rounded-2xl border border-rose-300 bg-white p-4 space-y-3">
            <p className="text-xs font-bold text-rose-900">
              Confirm Permanent Account Deletion:
            </p>
            <p className="text-xs text-slate-600">
              Please type <strong className="font-mono text-rose-700">DELETE</strong> in the box below to confirm:
            </p>
            <input
              type="text"
              className="input-field max-w-xs font-mono !py-2 text-xs"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />

            {deleteError && (
              <p className="text-xs font-bold text-rose-700">{deleteError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setDeleteError("");
                }}
                className="btn-secondary !py-2 !px-3 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || deleteConfirmText.trim().toUpperCase() !== "DELETE"}
                onClick={handleDeleteAccount}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-40 cursor-pointer shadow-sm"
              >
                {deleting ? "Deleting Account…" : "Confirm Permanent Deletion"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
