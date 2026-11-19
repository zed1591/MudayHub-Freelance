"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  ShieldCheck,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { EngagementsWorkspace, type EngagementsSubTab } from "@/components/dashboard/EngagementsWorkspace";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { useLanguage } from "@/components/LanguageProvider";
import type { Contract, Gig, Job, Profile, Proposal } from "@/lib/types";

type DashboardTab = "overview" | "engagements" | "settings";

interface TalentItem {
  profile: Profile;
  completed_contracts: number;
  active_gigs: number;
  reviews_count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isAm = language === "am";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [myGigs, setMyGigs] = useState<Gig[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [engagementsSubTab, setEngagementsSubTab] = useState<EngagementsSubTab>("contracts");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile-based Feed Data
  const [feedJobs, setFeedJobs] = useState<Job[]>([]);
  const [feedTalent, setFeedTalent] = useState<TalentItem[]>([]);
  const [feedGigs, setFeedGigs] = useState<Gig[]>([]);

  useEffect(() => {
    async function initDashboard() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (!meData.user) {
          router.push("/login");
          return;
        }

        const currentUserId = meData.user.id;
        setProfile(meData.user.profile);

        // Fetch remaining resources in parallel
        const [contractsRes, proposalsRes, gigsRes, jobsRes, talentRes] = await Promise.all([
          fetch("/api/contracts").then((r) => r.json()).catch(() => ({ contracts: [] })),
          fetch("/api/proposals").then((r) => r.json()).catch(() => ({ proposals: [] })),
          fetch("/api/gigs").then((r) => r.json()).catch(() => ({ gigs: [] })),
          fetch("/api/jobs").then((r) => r.json()).catch(() => ({ jobs: [] })),
          fetch("/api/talent").then((r) => r.json()).catch(() => ({ talent: [] })),
        ]);

        const allContracts = contractsRes.contracts || [];
        const allProposals = proposalsRes.proposals || [];
        const allGigs = gigsRes.gigs || [];
        const allJobs = jobsRes.jobs || [];
        const allTalent = talentRes.talent || [];

        setContracts(allContracts);
        setProposals(allProposals);
        setFeedGigs(allGigs);
        setFeedJobs(allJobs);
        setFeedTalent(allTalent);

        setMyGigs(allGigs.filter((g: Gig) => g.freelancer_id === currentUserId));
        setMyJobs(allJobs.filter((j: Job) => j.client_id === currentUserId));
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, [router]);

  async function handleRoleSwitch() {
    if (!profile) return;
    const newRole = isClient ? "freelancer" : "client";
    const res = await fetch("/api/profiles/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      if (updated.profile) {
        setProfile(updated.profile);
      } else {
        window.location.reload();
      }
    }
  }

  const isClient = profile?.role === "client";
  const isFreelancer = profile?.role === "freelancer";
  const isAdmin = profile?.role === "admin";

  const activeContracts = useMemo(
    () => contracts.filter((c) => c.escrow_status === "funded" || c.escrow_status === "work_submitted"),
    [contracts]
  );

  const earnedOrSpentEtb = useMemo(() => {
    return contracts
      .filter((c) => c.escrow_status === "completed")
      .reduce((sum, c) => sum + (isClient ? Number(c.total_amount_etb) : Number(c.freelancer_net_etb)), 0);
  }, [contracts, isClient]);

  const totalEscrowVolume = useMemo(() => {
    return activeContracts.reduce((sum, c) => sum + Number(c.total_amount_etb), 0);
  }, [activeContracts]);

  const recommendedJobs = useMemo(() => {
    if (!profile?.skills || profile.skills.length === 0) return feedJobs;
    const userSkillsLower = profile.skills.map((s) => s.toLowerCase());

    return [...feedJobs].sort((a, b) => {
      const aMatches = a.skills.filter((s) =>
        userSkillsLower.some((us) => s.toLowerCase().includes(us) || us.includes(s.toLowerCase()))
      ).length;
      const bMatches = b.skills.filter((s) =>
        userSkillsLower.some((us) => s.toLowerCase().includes(us) || us.includes(s.toLowerCase()))
      ).length;
      return bMatches - aMatches;
    });
  }, [feedJobs, profile]);

  const recommendedTalent = useMemo(() => {
    if (!profile?.skills || profile.skills.length === 0) return feedTalent;
    const clientCategories = profile.skills.map((s) => s.toLowerCase());

    return [...feedTalent].sort((a, b) => {
      const aSkills = (a.profile.skills || []).map((s) => s.toLowerCase());
      const bSkills = (b.profile.skills || []).map((s) => s.toLowerCase());
      const aMatch = aSkills.filter((s) =>
        clientCategories.some((c) => s.includes(c) || c.includes(s))
      ).length;
      const bMatch = bSkills.filter((s) =>
        clientCategories.some((c) => s.includes(c) || c.includes(s))
      ).length;
      return bMatch - aMatch;
    });
  }, [feedTalent, profile]);

  const recommendedGigs = useMemo(() => {
    if (!profile?.skills || profile.skills.length === 0) return feedGigs;
    const clientCategories = profile.skills.map((s) => s.toLowerCase());

    return [...feedGigs].sort((a, b) => {
      const aCategoryLower = a.category.toLowerCase();
      const bCategoryLower = b.category.toLowerCase();
      const aMatch = clientCategories.some((c) => aCategoryLower.includes(c) || c.includes(aCategoryLower));
      const bMatch = clientCategories.some((c) => bCategoryLower.includes(c) || c.includes(bCategoryLower));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return b.rating - a.rating;
    });
  }, [feedGigs, profile]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="card-surface h-56 w-full max-w-xl animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  const postingsCount = isClient ? myJobs.length : myGigs.length;
  const totalEngagementsCount = contracts.length + postingsCount + proposals.length;

  const tabsConfig = [
    {
      id: "overview" as DashboardTab,
      label: isAm ? "ዋና ማዕከል" : "Command Center",
      icon: LayoutDashboard,
    },
    {
      id: "engagements" as DashboardTab,
      label: isAm ? "ስራዎች እና ጨረታዎች" : "Engagements & Deals",
      icon: FileCheck2,
      count: totalEngagementsCount,
    },
    {
      id: "settings" as DashboardTab,
      label: isClient
        ? (isAm ? "ድርጅት እና ክፍያዎች" : "Organization & Rails")
        : (isAm ? "የቴሌብር አካውንት እና ፕሮፋይል" : "Telebirr Payout & Profile"),
      icon: SlidersHorizontal,
    },
  ];

  return (
    <div
      className={`relative transition-all duration-300 ${
        isFullScreen
          ? "w-full px-3 sm:px-6 lg:px-8 py-4 space-y-5"
          : "w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      }`}
    >
      <DashboardHeader
        profile={profile}
        isClient={isClient}
        isFreelancer={isFreelancer}
        isAdmin={isAdmin}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen((prev) => !prev)}
        onRoleSwitch={handleRoleSwitch}
      />

      {/* 2-Column Dashboard Workspace with Vertical Tabs Navigation */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vertical Tabs Navigation Sidebar */}
        <aside className="w-full lg:col-span-3 lg:sticky lg:top-20 space-y-4">
          <div className="card-surface rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-sm space-y-1">
            <div className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 mb-1">
              <span>{isAm ? "የስራ ክፍል ማውጫ" : "Workspace Tabs"}</span>
              <button
                type="button"
                onClick={() => setIsFullScreen((prev) => !prev)}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                title={isFullScreen ? "Compact View" : "Fullscreen Workspace"}
                aria-label={isFullScreen ? "Compact View" : "Fullscreen Workspace"}
              >
                {isFullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            </div>

            <nav className="flex flex-col gap-1.5" aria-label="Dashboard Workspace Tabs">
              {tabsConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-5 w-5 shrink-0 transition ${
                          isActive ? "text-brand" : "text-slate-400 group-hover:text-slate-700"
                        }`}
                      />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {typeof tab.count === "number" && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                          isActive
                            ? "bg-brand text-white"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Platform Security & Rails Snapshot */}
          <div className="hidden lg:block card-surface rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5 text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{isAm ? "የክፍያ ዋስትና" : "Escrow Trust Rail"}</span>
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs">
                {isAm ? "ንቁ" : "Active"}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAm
                ? "በቴሌብር እና በኢትዮጵያ ንግድ ባንክ በኩል በደረጃ የሚለቀቅ አስተማማኝ የክፍያ ዋስትና።"
                : "Programmatic milestone releases to Telebirr and CBE accounts with cryptographic SHA-256 deed generation."}
            </p>
          </div>
        </aside>

        {/* Right Column: Tab Panels Content Area */}
        <div className="w-full lg:col-span-9 min-w-0">
          {activeTab === "overview" && (
            <OverviewTab
              isClient={isClient}
              isFreelancer={isFreelancer}
              isAdmin={isAdmin}
              earnedOrSpentEtb={earnedOrSpentEtb}
              totalEscrowVolume={totalEscrowVolume}
              activeContracts={activeContracts}
              contracts={contracts}
              proposals={proposals}
              myJobs={myJobs}
              myGigs={myGigs}
              recommendedJobs={recommendedJobs}
              recommendedTalent={recommendedTalent}
              recommendedGigs={recommendedGigs}
              onOpenEngagements={(sub) => {
                setActiveTab("engagements");
                setEngagementsSubTab(sub);
              }}
              onOpenContracts={() => {
                setActiveTab("engagements");
                setEngagementsSubTab("contracts");
              }}
            />
          )}

          {activeTab === "engagements" && (
            <EngagementsWorkspace
              isClient={isClient}
              contracts={contracts}
              myJobs={myJobs}
              myGigs={myGigs}
              proposals={proposals}
              initialSubTab={engagementsSubTab}
              isFullScreen={isFullScreen}
              onToggleFullScreen={() => setIsFullScreen((prev) => !prev)}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              profile={profile}
              isClient={isClient}
              onSaved={(updated) => setProfile(updated)}
              onRoleSwitch={handleRoleSwitch}
            />
          )}
        </div>
      </div>
    </div>
  );
}
