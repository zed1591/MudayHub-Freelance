/**
 * MudayHub Sovereign Specialist Reputation & Leveling Engine
 * Computes progressive trust levels, badges, and unlockable platform privileges
 * based on verified contracts completed, client star ratings, and Muday Vault clearance.
 */

export type FreelancerLevelId = "new" | "verified" | "rising" | "top_rated" | "master";

export interface FreelancerLevel {
  id: FreelancerLevelId;
  levelNumber: number;
  title: string;
  amharicTitle: string;
  badgeLabel: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  minCompleted: number;
  minRating: number;
  perks: readonly string[];
  progressPercent: number;
  nextLevelPrompt?: string;
}

export const FREELANCER_LEVELS_CONFIG = {
  master: {
    levelNumber: 4,
    title: "Muday Master",
    amharicTitle: "የሙዳይ ማስተር",
    badgeLabel: "Muday Master",
    colorClass: "text-slate-900",
    bgClass: "bg-slate-100",
    borderClass: "border-slate-300",
    minCompleted: 10,
    minRating: 4.85,
    perks: [
      "Priority directory placement at top of marketplace search",
      "Instant arbiter recommendation for enterprise project RFPs",
      "VIP expedited Telebirr payout processing",
      "Exclusive Master badge on profile, gigs, and proposals",
    ],
  },
  top_rated: {
    levelNumber: 3,
    title: "Top Rated",
    amharicTitle: "ከፍተኛ ደረጃ",
    badgeLabel: "Top Rated",
    colorClass: "text-amber-800",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-400/40",
    minCompleted: 5,
    minRating: 4.75,
    perks: [
      "Gold Top Rated badge on all search results and solution pitches",
      "Featured inclusion in hiring client weekly talent digests",
      "Preferred eligibility for high-budget (50,000+ ETB) briefs",
    ],
  },
  rising: {
    levelNumber: 2,
    title: "Rising Talent",
    amharicTitle: "ተስፈኛ ባለሙያ",
    badgeLabel: "Rising Talent",
    colorClass: "text-brand-dark",
    bgClass: "bg-orange-50",
    borderClass: "border-brand/30",
    minCompleted: 2,
    minRating: 4.5,
    perks: [
      "Rising Talent badge demonstrating consistent quality",
      "Highlighted proposal badge in client bid reviews",
      "Up to 10 active Ready Service Package listings",
    ],
  },
  verified: {
    levelNumber: 1,
    title: "Verified Specialist",
    amharicTitle: "የተረጋገጠ ባለሙያ",
    badgeLabel: "Level 1 Specialist",
    colorClass: "text-emerald-800",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-300",
    minCompleted: 1,
    minRating: 4.0,
    perks: [
      "Official Level 1 verified delivery badge",
      "Unlocks direct client project invitations",
      "Eligible for Ready Service Package creation",
    ],
  },
  new: {
    levelNumber: 0,
    title: "New Talent",
    amharicTitle: "አዲስ ባለሙያ",
    badgeLabel: "New Talent",
    colorClass: "text-slate-700",
    bgClass: "bg-slate-100",
    borderClass: "border-slate-200",
    minCompleted: 0,
    minRating: 1.0,
    perks: [
      "Apply to open project requests with custom bids",
      "Create up to 3 Ready Service Packages",
      "Direct contract chat & milestone workspace access",
    ],
  },
} as const;

/**
 * Calculates a specialist's earned level and progression to the next milestone tier.
 */
export function computeFreelancerLevel(
  rating: number = 5.0,
  completedContracts: number = 0
): FreelancerLevel {
  const r = typeof rating === "number" && !isNaN(rating) ? rating : 5.0;
  const c = typeof completedContracts === "number" && !isNaN(completedContracts) ? completedContracts : 0;

  // Level 4: Muday Master
  if (c >= FREELANCER_LEVELS_CONFIG.master.minCompleted && r >= FREELANCER_LEVELS_CONFIG.master.minRating) {
    return {
      id: "master",
      ...FREELANCER_LEVELS_CONFIG.master,
      progressPercent: 100,
      nextLevelPrompt: "You have achieved the highest platform tier: Muday Master!",
    };
  }

  // Level 3: Top Rated
  if (c >= FREELANCER_LEVELS_CONFIG.top_rated.minCompleted && r >= FREELANCER_LEVELS_CONFIG.top_rated.minRating) {
    const contractsNeeded = FREELANCER_LEVELS_CONFIG.master.minCompleted - c;
    const progress = Math.min(
      95,
      Math.round(
        ((c - FREELANCER_LEVELS_CONFIG.top_rated.minCompleted) /
          (FREELANCER_LEVELS_CONFIG.master.minCompleted - FREELANCER_LEVELS_CONFIG.top_rated.minCompleted)) *
          100
      )
    );
    return {
      id: "top_rated",
      ...FREELANCER_LEVELS_CONFIG.top_rated,
      progressPercent: Math.max(50, progress),
      nextLevelPrompt: `${contractsNeeded} more 5-star delivery to reach Muday Master tier`,
    };
  }

  // Level 2: Rising Talent
  if (c >= FREELANCER_LEVELS_CONFIG.rising.minCompleted && r >= FREELANCER_LEVELS_CONFIG.rising.minRating) {
    const contractsNeeded = FREELANCER_LEVELS_CONFIG.top_rated.minCompleted - c;
    const progress = Math.min(
      90,
      Math.round(
        ((c - FREELANCER_LEVELS_CONFIG.rising.minCompleted) /
          (FREELANCER_LEVELS_CONFIG.top_rated.minCompleted - FREELANCER_LEVELS_CONFIG.rising.minCompleted)) *
          100
      )
    );
    return {
      id: "rising",
      ...FREELANCER_LEVELS_CONFIG.rising,
      progressPercent: Math.max(40, progress),
      nextLevelPrompt: `${contractsNeeded} more completed projects to reach Top Rated tier`,
    };
  }

  // Level 1: Verified Specialist
  if (c >= FREELANCER_LEVELS_CONFIG.verified.minCompleted && r >= FREELANCER_LEVELS_CONFIG.verified.minRating) {
    const contractsNeeded = FREELANCER_LEVELS_CONFIG.rising.minCompleted - c;
    return {
      id: "verified",
      ...FREELANCER_LEVELS_CONFIG.verified,
      progressPercent: 35,
      nextLevelPrompt: `${contractsNeeded} more project with 4.5+ rating to unlock Rising Talent`,
    };
  }

  // Level 0: New Talent
  return {
    id: "new",
    ...FREELANCER_LEVELS_CONFIG.new,
    progressPercent: 10,
    nextLevelPrompt: "Complete your 1st milestone delivery to earn Level 1 Verified status",
  };
}
