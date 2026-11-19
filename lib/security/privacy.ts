import type { Profile } from "@/lib/types";

export interface PublicProfileSafe {
  id: string;
  role: Profile["role"];
  full_name: string;
  headline?: string | null;
  avatar_url?: string | null;
  bio: string;
  skills: string[];
  github_url?: string | null;
  portfolio_url?: string | null;
  linkedin_url?: string | null;
  past_projects?: Profile["past_projects"];
  experience?: Profile["experience"];
  education?: Profile["education"];
  certifications?: Profile["certifications"];
  rating: number;
  is_verified: boolean;
  created_at: string;
}

/**
 * Privacy by Design / Data Minimization:
 * Strips confidential PII (phone number, Telebirr payout destination, bank details, private telegram chat id)
 * while including verified portfolio projects, avatar photo, education, experience, and open source links.
 */
export function sanitizePublicProfile(profile: Profile | Partial<Profile>): PublicProfileSafe {
  return {
    id: profile.id || "",
    role: profile.role || "freelancer",
    full_name: profile.full_name || "",
    headline: profile.headline || null,
    avatar_url: profile.avatar_url || null,
    bio: profile.bio || "",
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    github_url: profile.github_url || null,
    portfolio_url: profile.portfolio_url || null,
    linkedin_url: profile.linkedin_url || null,
    past_projects: Array.isArray(profile.past_projects) ? profile.past_projects : [],
    experience: Array.isArray(profile.experience) ? profile.experience : [],
    education: Array.isArray(profile.education) ? profile.education : [],
    certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
    rating: typeof profile.rating === "number" ? profile.rating : 5,
    is_verified: Boolean(profile.is_verified),
    created_at: profile.created_at || new Date().toISOString(),
  };
}
