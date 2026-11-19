"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { EngagementsWorkspace, type EngagementsSubTab } from "@/components/dashboard/EngagementsWorkspace";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
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
      label: "Command Center",
      icon: LayoutDashboard,
    },
    {
      id: "engagements" as DashboardTab,
      label: "Engagements & Deals",
      icon: FileCheck2,
      count: totalEngagementsCount,
    },
    {
      id: "settings" as DashboardTab,
      label: isClient ? "Organization & Rails" : "Telebirr Payout & Profile",
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
      {/* Background ambient accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-1/4 -z-10 h-96 w-96 rounded-full bg-rose-500/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-1/2 -z-10 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl"
      />

      <DashboardHeader
        profile={profile}
        isClient={isClient}
        isFreelancer={isFreelancer}
        isAdmin={isAdmin}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen((prev) => !prev)}
        onRoleSwitch={handleRoleSwitch}
      />

      {/* Modern Interactive Workspace Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <nav
          className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto"
          aria-label="Dashboard Workspace Tabs"
        >
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-950/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition ${
                    isActive ? "text-[#C8102E]" : "text-slate-400 group-hover:text-slate-700"
                  }`}
                />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                      isActive
                        ? "bg-[#C8102E] text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Workspace Fullscreen Toggle Button */}
        <button
          type="button"
          onClick={() => setIsFullScreen((prev) => !prev)}
          className="btn-secondary !py-2 !px-3 !text-xs font-bold flex items-center gap-1.5 self-end sm:self-auto cursor-pointer hover:border-[#C8102E]/40"
          title={isFullScreen ? "Exit Fullscreen Workspace" : "Maximize Fullscreen Workspace"}
        >
          {isFullScreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">Normal View</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">Fullscreen Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="w-full">
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
  );
}
