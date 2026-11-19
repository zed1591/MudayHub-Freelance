"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  MapPin,
  ShieldCheck,
  Star,
  Crown,
  Award,
  Zap,
  TrendingUp,
  Github,
  Globe,
  ExternalLink,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Linkedin,
  Calendar,
  Share2,
  Check,
} from "lucide-react";
import type { Gig, Job, Profile, Review } from "@/lib/types";
import { GigCard } from "@/components/GigCard";
import { formatEtb, formatMemberSince } from "@/lib/utils";
import { computeFreelancerLevel } from "@/lib/levels";

type ProfileTab = "services" | "portfolio" | "experience" | "education" | "jobs" | "reviews";

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completed, setCompleted] = useState(0);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("services");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  function copyProfileLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  useEffect(() => {
    fetch(`/api/profiles/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.profile);
        setCompleted(d.completed_contracts || 0);
        setGigs(d.gigs || []);
        setJobs(d.jobs || []);
        setReviews(d.reviews || []);
        if (d.profile?.role === "client") {
          setActiveTab("jobs");
        } else {
          setActiveTab("services");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-slate-400">
        Loading Muday-Freelance profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-slate-900 text-base font-semibold">Profile not found.</p>
        <Link href="/talent" className="btn-secondary mt-4 inline-block !text-xs font-semibold">
          Back to Specialists Directory
        </Link>
      </div>
    );
  }

  const isClient = profile.role === "client";
  const isFreelancer = profile.role === "freelancer";
  const level = isFreelancer ? computeFreelancerLevel(profile.rating, completed) : null;
  const pastProjects = profile.past_projects || [];
  const experience = profile.experience || [];
  const education = profile.education || [];
  const certifications = profile.certifications || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Brand Profile Header Card */}
      <div className="card-surface rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 sm:gap-6">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={80}
                height={80}
                className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-sm ring-2 ring-brand/20"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-terracotta text-2xl font-black text-white shadow-sm">
                {profile.full_name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  {profile.full_name}
                </h1>
                {profile.is_verified && (
                  <span title="Verified profile">
                    <BadgeCheck className="h-6 w-6 text-emerald-600" />
                  </span>
                )}
              </div>

              {profile.headline && (
                <p className="text-sm font-semibold text-slate-800 pt-0.5">
                  {profile.headline}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <p className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-2 font-mono">
                  <span>{isClient ? "Hiring Entity" : "Muday Vetted Specialist"}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-ethio text-slate-500">ሙዳይ ፍሪላንስ</span>
                </p>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    <span>Muday Verified</span>
                  </span>
                )}
                {level && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${level.bgClass} ${level.colorClass} ${level.borderClass}`}>
                    {level.id === "master" && <Crown className="h-3.5 w-3.5 fill-amber-400 text-amber-600" />}
                    {level.id === "top_rated" && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />}
                    {level.id === "rising" && <Zap className="h-3.5 w-3.5 text-brand" />}
                    {level.id === "verified" && <Award className="h-3.5 w-3.5 text-emerald-600" />}
                    <span>{level.badgeLabel} ({level.amharicTitle})</span>
                  </span>
                )}
              </div>

              {/* Social and Open Source Links */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                {profile.github_url && (
                  <a
                    href={profile.github_url.startsWith("http") ? profile.github_url : `https://${profile.github_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-brand/40 hover:text-brand transition"
                  >
                    <Github className="h-3.5 w-3.5 text-slate-800" />
                    <span>GitHub</span>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </a>
                )}
                {profile.portfolio_url && (
                  <a
                    href={profile.portfolio_url.startsWith("http") ? profile.portfolio_url : `https://${profile.portfolio_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-brand/40 hover:text-brand transition"
                  >
                    <Globe className="h-3.5 w-3.5 text-brand" />
                    <span>Portfolio</span>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-brand/40 hover:text-brand transition"
                  >
                    <Linkedin className="h-3.5 w-3.5 text-blue-600" />
                    <span>LinkedIn</span>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1.5 text-xs text-slate-500">
                {isFreelancer && (
                  <>
                    <div className="flex items-center gap-1 text-amber-500 font-bold font-mono">
                      <Star className="h-4 w-4 fill-amber-500" />
                      <span className="text-slate-900">{profile.rating.toFixed(1)}</span>
                      <span className="text-slate-500 font-normal">({reviews.length} reviews)</span>
                    </div>
                    <span>·</span>
                  </>
                )}

                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-slate-700 font-mono">
                    {completed} {isClient ? "Completed projects" : "Completed deliveries"}
                  </span>
                </div>

                <span>·</span>
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-brand" />
                  <span>Member since {formatMemberSince(profile.created_at)}</span>
                </div>

                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand" />
                  <span>Marketplace profile</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={copyProfileLink}
              className="btn-secondary !text-xs !py-2.5 !px-3.5 font-semibold inline-flex items-center gap-1.5"
              title="Copy public profile URL to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copied ? "Link Copied!" : "Share Profile"}</span>
            </button>

            {isFreelancer && (
              <Link
                href={`/jobs/new?invite=${profile.id}`}
                className="btn-primary !text-xs !py-2.5 !px-4 font-bold shadow-ochre inline-flex items-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Hire Specialist / Request Project</span>
              </Link>
            )}

            {isFreelancer && gigs.length > 0 && (
              <button
                onClick={() => setActiveTab("services")}
                className="btn-secondary !text-xs !py-2.5 !px-4 font-bold"
              >
                Browse {gigs.length} Services
              </button>
            )}

            {isClient && jobs.length > 0 && (
              <button
                onClick={() => setActiveTab("jobs")}
                className="btn-primary !text-xs !py-2.5 !px-5 font-bold shadow-ochre"
              >
                View {jobs.length} Open Requests
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className="mt-6 text-xs sm:text-sm leading-relaxed text-slate-600">
          {profile.bio || (isClient ? "No organization summary provided." : "No professional bio provided.")}
        </p>

        <div className="mt-6 grid gap-3 border-y border-slate-200 py-5 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isClient ? "Completed projects" : "Completed deliveries"}
            </p>
            <p className="mt-1 text-xl font-extrabold text-slate-900 font-mono">{completed}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isClient ? "Open project briefs" : "Live service packages"}
            </p>
            <p className="mt-1 text-xl font-extrabold text-slate-900 font-mono">{isClient ? jobs.length : gigs.length}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Verified reviews</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900 font-mono">{reviews.length}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isFreelancer ? "C²SA Trust Deeds" : "Member Since"}
            </p>
            {isFreelancer ? (
              <Link
                href="/verify"
                className="mt-1 text-sm font-extrabold text-emerald-700 hover:underline font-mono flex items-center gap-1.5"
                title="Verify cryptographic trust deeds on C²SA ledger"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{completed} Minted Deeds &rarr;</span>
              </Link>
            ) : (
              <p className="mt-1 text-base font-extrabold text-slate-900 font-mono flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-brand" />
                <span>{formatMemberSince(profile.created_at)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Freelancer Level Progress Card */}
        {isFreelancer && level && (
          <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand" />
                <span className="text-xs font-bold text-slate-900">
                  Specialist Tier Progression · ደረጃ {level.levelNumber} ({level.title} - {level.amharicTitle})
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 font-mono">
                {level.nextLevelPrompt}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-gradient-to-r from-brand to-amber-500 transition-all duration-500"
                style={{ width: `${level.progressPercent}%` }}
              />
            </div>

            {/* Active Perks */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-600">
              <span className="font-bold text-slate-700">Tier Privileges:</span>
              {level.perks.slice(0, 2).map((perk) => (
                <span key={perk} className="inline-flex items-center gap-1">
                  <span className="text-emerald-600">✓</span>
                  <span>{perk}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Technical Skills (Freelancer Only) */}
        {isFreelancer && profile.skills && profile.skills.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verified Technical Competencies
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-brand/40 transition"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Section Selector Horizontal Pills (Desktop) + Dropdown (Mobile) */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Desktop Horizontal Pill Buttons */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto">
          {isFreelancer && (
            <button
              type="button"
              onClick={() => setActiveTab("services")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "services"
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Ready Services</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeTab === "services" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {gigs.length}
              </span>
            </button>
          )}

          {isFreelancer && (
            <button
              type="button"
              onClick={() => setActiveTab("portfolio")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "portfolio"
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <FolderGit2 className="h-3.5 w-3.5" />
              <span>Portfolio &amp; Work</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeTab === "portfolio" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {pastProjects.length}
              </span>
            </button>
          )}

          {isFreelancer && (
            <button
              type="button"
              onClick={() => setActiveTab("experience")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "experience"
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Experience</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeTab === "experience" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {experience.length}
              </span>
            </button>
          )}

          {isFreelancer && (
            <button
              type="button"
              onClick={() => setActiveTab("education")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "education"
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Education &amp; Certs</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeTab === "education" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {education.length + certifications.length}
              </span>
            </button>
          )}

          {isClient && (
            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "jobs"
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Posted Projects</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeTab === "jobs" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {jobs.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "reviews"
                ? "bg-brand text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Star className="h-3.5 w-3.5" />
            <span>Verified Reviews</span>
            <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
              activeTab === "reviews" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {reviews.length}
            </span>
          </button>
        </div>

        {/* Mobile Dropdown Selector */}
        <div className="flex sm:hidden items-center gap-2.5 w-full">
          <select
            id="profile-tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as ProfileTab)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 shadow-sm outline-none focus:border-brand transition cursor-pointer w-full"
          >
            {isFreelancer && <option value="services">Ready Services ({gigs.length})</option>}
            {isFreelancer && <option value="portfolio">Past Projects Done Before ({pastProjects.length})</option>}
            {isFreelancer && <option value="experience">Experience &amp; Work History ({experience.length})</option>}
            {isFreelancer && <option value="education">Education &amp; Certifications ({education.length + certifications.length})</option>}
            {isClient && <option value="jobs">Posted Projects ({jobs.length})</option>}
            <option value="reviews">Verified Reviews ({reviews.length})</option>
          </select>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="mt-6 space-y-6">
        {/* Services Tab Content */}
        {activeTab === "services" && (
          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ready Service Packages</h2>
                <p className="mt-1 text-xs text-slate-500">Fixed-scope deliverables with transparent pricing and milestone guarantees.</p>
              </div>
              <span className="text-xs font-bold text-brand-dark">{gigs.length} live</span>
            </div>
            {gigs.length === 0 ? (
              <div className="card-surface rounded-3xl p-12 text-center text-xs text-slate-500 border border-slate-200">
                No active service packages published yet.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gigs.map((g) => (
                  <GigCard key={g.id} gig={g} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Past Projects / Portfolio Tab Content */}
        {activeTab === "portfolio" && (
          <div className="space-y-4">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FolderGit2 className="h-5 w-5 text-brand" />
                  <span>Past Projects &amp; Work Done Before</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">Verified portfolio items, open-source repositories, and past client deliverables.</p>
              </div>
              <span className="text-xs font-bold text-brand-dark">{pastProjects.length} items</span>
            </div>

            {pastProjects.length === 0 ? (
              <div className="card-surface rounded-3xl p-12 text-center text-xs text-slate-500 border border-slate-200">
                No past projects added to showcase yet.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {pastProjects.map((proj, idx) => (
                  <div
                    key={proj.id || idx}
                    className="card-surface rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:border-brand/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-bold text-slate-900">{proj.title}</h3>
                        {proj.link && (
                          <a
                            href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 shrink-0"
                          >
                            <span>Live Project</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                        {proj.description}
                      </p>
                    </div>

                    {proj.tags && proj.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                        {proj.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Experience & Work History Tab Content */}
        {activeTab === "experience" && (
          <div className="space-y-4">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-brand" />
                  <span>Experience &amp; Work History</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">Professional career background, full-time positions, and enterprise consulting.</p>
              </div>
            </div>

            {experience.length === 0 ? (
              <div className="card-surface rounded-3xl p-12 text-center text-xs text-slate-500 border border-slate-200">
                No work history entries listed yet.
              </div>
            ) : (
              <div className="space-y-4">
                {experience.map((exp, idx) => (
                  <div
                    key={exp.id || idx}
                    className="card-surface rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:border-brand/40 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{exp.title}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-brand-dark">{exp.company}</span>
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                        {exp.duration}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="mt-3 text-xs leading-relaxed text-slate-600">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Education & Certifications Tab Content */}
        {activeTab === "education" && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Education Section */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                <span>Degrees &amp; Formal Education</span>
              </h2>

              {education.length === 0 ? (
                <div className="card-surface rounded-3xl p-8 text-center text-xs text-slate-500 border border-slate-200">
                  No academic degrees listed.
                </div>
              ) : (
                <div className="space-y-3">
                  {education.map((edu, idx) => (
                    <div
                      key={edu.id || idx}
                      className="card-surface rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{edu.degree}</p>
                          <p className="text-xs font-semibold text-slate-600 mt-0.5">{edu.institution}</p>
                          {edu.field && <p className="text-[11px] text-slate-500">{edu.field}</p>}
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                          {edu.year}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications Section */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-slate-700" />
                <span>Certifications &amp; Recognitions</span>
              </h2>

              {certifications.length === 0 ? (
                <div className="card-surface rounded-3xl p-8 text-center text-xs text-slate-500 border border-slate-200">
                  No professional certifications listed.
                </div>
              ) : (
                <div className="space-y-3">
                  {certifications.map((cert, idx) => (
                    <div
                      key={cert.id || idx}
                      className="card-surface rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{cert.name}</p>
                          <p className="text-xs font-semibold text-slate-600 mt-0.5">{cert.issuer}</p>
                        </div>
                        {cert.year && (
                          <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                            {cert.year}
                          </span>
                        )}
                      </div>
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url.startsWith("http") ? cert.credential_url : `https://${cert.credential_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                        >
                          <span>Verify Credential</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab Content (Client Only) */}
        {activeTab === "jobs" && (
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="card-surface rounded-3xl p-12 text-center text-xs text-slate-500 border border-slate-200">
                No open project requests currently listed.
              </div>
            ) : (
              jobs.map((j) => (
                <div key={j.id} className="card-surface rounded-3xl border border-slate-200/90 p-6 space-y-3 hover:border-brand/40 transition shadow-sm">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="badge-brand">{j.category}</span>
                      <h3 className="mt-2 text-base font-bold text-slate-900">
                        <Link href={`/jobs/${j.id}`} className="hover:text-brand-dark transition">
                          {j.title}
                        </Link>
                      </h3>
                    </div>
                    <span className="text-base font-mono font-bold text-slate-900">{formatEtb(j.budget_etb)}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{j.description}</p>
                  <div className="pt-2 flex justify-end">
                    <Link href={`/jobs/${j.id}`} className="btn-secondary !text-xs !py-1.5 !px-3.5 font-bold">
                      View Project Scope
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reviews Tab Content */}
        {activeTab === "reviews" && (
          <div className="card-surface rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Verified Escrow Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No reviews submitted yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="pt-4 first:pt-0 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900">{r.author?.full_name || "Verified Client"}</span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold font-mono">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        <span>{r.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">&quot;{r.comment}&quot;</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
