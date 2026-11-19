/**
 * Unified profile strength & completeness calculator.
 * Ensures consistent percentages across onboarding, dashboard, and public profile views.
 */

export interface ProfileStrengthInput {
  role?: "client" | "freelancer" | "admin";
  fullName?: string;
  headline?: string;
  bio?: string;
  skills?: string[] | string;
  phone?: string;
  telebirr?: string;
  avatarUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  pastProjects?: unknown[];
  education?: unknown[];
  certifications?: unknown[];
  paymentMethods?: unknown[];
}

export function calculateProfileStrength(input: ProfileStrengthInput): number {
  const isFreelancer = input.role !== "client";
  const fullName = (input.fullName || "").trim();
  const headline = (input.headline || "").trim();
  const bio = (input.bio || "").trim();
  const phone = (input.phone || "").trim();
  const telebirr = (input.telebirr || "").trim();
  const avatarUrl = (input.avatarUrl || "").trim();
  const githubUrl = (input.githubUrl || "").trim();
  const portfolioUrl = (input.portfolioUrl || "").trim();
  const linkedinUrl = (input.linkedinUrl || "").trim();

  const skillsCount = Array.isArray(input.skills)
    ? input.skills.length
    : (input.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean).length;

  const pastProjectsCount = Array.isArray(input.pastProjects) ? input.pastProjects.length : 0;
  const eduCertCount =
    (Array.isArray(input.education) ? input.education.length : 0) +
    (Array.isArray(input.certifications) ? input.certifications.length : 0);
  const paymentMethodsCount = Array.isArray(input.paymentMethods) ? input.paymentMethods.length : 0;

  if (isFreelancer) {
    const points = [
      Boolean(fullName),
      Boolean(headline),
      Boolean(bio && bio.length >= 20),
      skillsCount >= 3,
      Boolean(telebirr || phone || paymentMethodsCount > 0),
      Boolean(githubUrl || portfolioUrl || linkedinUrl),
      pastProjectsCount > 0,
      eduCertCount > 0,
      Boolean(avatarUrl),
    ];
    return Math.round((points.filter(Boolean).length / points.length) * 100);
  }

  // Client profile criteria
  const clientPoints = [
    Boolean(fullName),
    Boolean(headline),
    Boolean(bio && bio.length >= 20),
    skillsCount >= 1,
    Boolean(phone || telebirr || paymentMethodsCount > 0),
    Boolean(avatarUrl),
  ];
  return Math.round((clientPoints.filter(Boolean).length / clientPoints.length) * 100);
}
