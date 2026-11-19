import { z } from "zod";

const compactText = (max: number, label: string, min = 1) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} exceeds maximum allowed length of ${max}`);

const ethiopianPhoneRegex = /^\+251[97][0-9]{8}$/;

function normalizeEthiopianPhoneInput(val: unknown): string {
  if (typeof val !== "string") return "";
  const cleaned = val.trim().replace(/[\s-]/g, "");
  if (!cleaned || cleaned === "+2519" || cleaned === "+2517" || cleaned === "+251" || cleaned === "+") {
    return "";
  }
  if (/^0[97]\d{8}$/.test(cleaned)) {
    return "+251" + cleaned.slice(1);
  }
  if (/^[97]\d{8}$/.test(cleaned)) {
    return "+251" + cleaned;
  }
  if (/^251[97]\d{8}$/.test(cleaned)) {
    return "+" + cleaned;
  }
  return cleaned;
}

export const loginSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address").max(254),
    password: z.string().min(8, "Password must be at least 8 characters").max(256),
  })
  .strict();

export const registerSchema = loginSchema
  .extend({
    full_name: compactText(120, "Full name", 1),
    role: z.enum(["client", "freelancer"]),
    phone: z
      .string()
      .nullish()
      .transform((val) => normalizeEthiopianPhoneInput(val))
      .refine(
        (val) => !val || ethiopianPhoneRegex.test(val),
        { message: "Phone must match +2519xxxxxxxx or +2517xxxxxxxx" }
      ),
  })
  .strict();

export const jobSchema = z
  .object({
    title: compactText(140, "Title", 1),
    description: compactText(12_000, "Description", 1),
    category: compactText(80, "Category", 1),
    budget_etb: z.coerce
      .number()
      .finite()
      .min(100, "Budget must be at least 100 ETB")
      .max(10_000_000, "Budget exceeds platform limit"),
    skills: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  })
  .strict();

export const proposalSchema = z
  .object({
    job_id: z.string().trim().min(1, "Job ID is required"),
    bid_amount_etb: z.coerce
      .number()
      .finite()
      .min(50, "Bid must be at least 50 ETB")
      .max(10_000_000, "Bid exceeds limit"),
    duration_days: z.coerce
      .number()
      .int()
      .min(1, "Duration must be at least 1 day")
      .max(365, "Duration exceeds 1 year"),
    cover_letter: compactText(10_000, "Cover letter", 1),
  })
  .strict();

export const gigPackageSchema = z
  .object({
    name: z.enum(["basic", "standard", "premium"]).optional(),
    title: compactText(80, "Package title", 1),
    description: compactText(1000, "Package description", 1),
    price_etb: z.coerce.number().finite().min(50, "Price must be at least 50 ETB").max(10_000_000),
    delivery_days: z.coerce.number().int().min(1).max(180),
    revisions: z.coerce.number().int().min(0).max(50),
    features: z.array(z.string().trim().max(100)).max(20).optional().default([]),
  })
  .strict();

export const gigSchema = z
  .object({
    title: compactText(140, "Gig title", 1),
    category: compactText(80, "Category", 1),
    description: compactText(10_000, "Description", 1),
    cover_image: z.string().trim().url().optional().or(z.literal("")),
    gallery: z.array(z.string().trim().url()).max(10).optional().default([]),
    tags: z.array(z.string().trim().min(1).max(30)).max(20).optional().default([]),
    packages: z.object({
      basic: gigPackageSchema,
      standard: gigPackageSchema,
      premium: gigPackageSchema,
    }),
  })
  .strict();

export const orderGigSchema = z
  .object({
    packageTier: z.enum(["basic", "standard", "premium"]),
    requirements: z.string().trim().max(5_000).optional(),
  })
  .strict();

export const messageSchema = z
  .object({
    contractId: z.string().trim().min(1, "Invalid contract ID"),
    body: compactText(4_000, "Message", 1),
  })
  .strict();

export const escrowCheckoutSchema = z
  .object({
    contractId: z.string().trim().min(1, "Contract ID is required"),
  })
  .strict();

export const escrowSubmitWorkSchema = z
  .object({
    contractId: z.string().trim().min(1, "Contract ID is required"),
    work_submission_url: z
      .string()
      .trim()
      .max(2_000)
      .refine(
        (val) => /^https:\/\//i.test(val) || /^\/api\/storage\/download\?fileId=/i.test(val),
        "Deliverable URL must be a secure HTTPS link or an uploaded file reference"
      ),
    work_submission_notes: z.string().trim().max(5_000).optional(),
  })
  .strict();

export const escrowReleaseSchema = z
  .object({
    contractId: z.string().trim().min(1, "Contract ID is required"),
    milestoneId: z.string().trim().optional(),
  })
  .strict();

export const escrowDisputeSchema = z
  .object({
    contractId: z.string().trim().min(1, "Contract ID is required"),
    category: z
      .enum([
        "missed_deadline",
        "scope_creep",
        "quality_mismatch",
        "unresponsive",
        "breach_of_terms",
        "other",
      ])
      .optional(),
    reason: compactText(5_000, "Dispute reason", 10),
    evidence_url: z
      .string()
      .trim()
      .url("Evidence must be a valid URL")
      .regex(/^https:\/\//i, "Evidence URL must use HTTPS protocol")
      .max(2_000)
      .optional()
      .or(z.literal("")),
    evidence_notes: z.string().trim().max(2_000).optional(),
  })
  .strict();

export const adminResolveDisputeSchema = z
  .object({
    disputeId: z.string().trim().min(1, "Dispute ID is required"),
    status: z.enum(["under_review", "resolved"]),
    resolution_notes: z.string().trim().max(5_000).optional(),
    outcome: z.enum(["release", "refund", "split"]).optional(),
    split_pct: z.coerce.number().min(1).max(99).optional(),
  })
  .strict();

export const worklogCreateSchema = z
  .object({
    contractId: z.string().trim().min(1, "Contract ID is required"),
    milestoneId: z.string().trim().optional(),
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(140),
    description: z.string().trim().min(5, "Description must be at least 5 characters").max(5_000),
    hours_spent: z.coerce.number().min(0).max(100).optional(),
    deliverable_url: z
      .string()
      .trim()
      .url("Deliverable URL must be valid")
      .max(2_000)
      .optional()
      .or(z.literal("")),
  })
  .strict();

export const worklogReviewSchema = z
  .object({
    status: z.enum(["approved", "needs_revision"]),
    feedback: z.string().trim().max(2_000).optional(),
  })
  .strict();

export const reviewSchema = z
  .object({
    contract_id: z.string().trim().min(1, "Contract ID is required"),
    rating: z.coerce
      .number()
      .int()
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5"),
    comment: compactText(2_000, "Review comment", 1),
  })
  .strict();

export const profileUpdateSchema = z
  .object({
    full_name: z.string().trim().min(1, "Full name is required").max(120).optional(),
    headline: z.string().trim().max(140).optional().or(z.literal("")),
    avatar_url: z.string().trim().max(1000).optional().or(z.literal("")).nullable(),
    role: z.enum(["client", "freelancer"]).optional(),
    bio: z.string().trim().max(2_000).optional(),
    skills: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    github_url: z.string().trim().max(255).optional().or(z.literal("")),
    portfolio_url: z.string().trim().max(255).optional().or(z.literal("")),
    linkedin_url: z.string().trim().max(255).optional().or(z.literal("")),
    past_projects: z
      .array(
        z.object({
          id: z.string().optional(),
          title: z.string().trim().min(1).max(140),
          description: z.string().trim().max(1_500),
          link: z.string().trim().max(255).optional().or(z.literal("")),
          tags: z.array(z.string().trim().max(40)).max(10).optional(),
        })
      )
      .max(12)
      .optional(),
    experience: z
      .array(
        z.object({
          id: z.string().optional(),
          title: z.string().trim().min(1).max(140),
          company: z.string().trim().min(1).max(140),
          duration: z.string().trim().max(60),
          description: z.string().trim().max(1_500).optional(),
        })
      )
      .max(10)
      .optional(),
    education: z
      .array(
        z.object({
          id: z.string().optional(),
          institution: z.string().trim().min(1).max(140),
          degree: z.string().trim().max(100),
          field: z.string().trim().max(100),
          year: z.string().trim().max(30),
        })
      )
      .max(10)
      .optional(),
    certifications: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().trim().min(1).max(140),
          issuer: z.string().trim().min(1).max(140),
          year: z.string().trim().max(30).optional(),
          credential_url: z.string().trim().max(255).optional().or(z.literal("")),
        })
      )
      .max(10)
      .optional(),
    payment_methods: z
      .array(
        z.object({
          id: z.string().min(1),
          type: z.enum(["telebirr", "cbe_birr", "bank_transfer", "card"]),
          title: z.string().trim().max(100),
          account_identifier: z.string().trim().max(100),
          bank_details: z
            .object({
              bank_name: z.string().trim().max(120),
              account_number: z.string().trim().max(50),
              account_holder_name: z.string().trim().max(120),
            })
            .optional(),
          is_default: z.boolean().default(false),
          created_at: z.string().optional(),
        })
      )
      .max(10)
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(ethiopianPhoneRegex, "Phone must match +2519xxxxxxxx or +2517xxxxxxxx")
      .optional()
      .or(z.literal("")),
    telebirr_number: z
      .string()
      .trim()
      .regex(ethiopianPhoneRegex, "Telebirr number must match +2519xxxxxxxx or +2517xxxxxxxx")
      .optional()
      .or(z.literal("")),
    telegram_chat_id: z.string().trim().max(50).optional().or(z.literal("")),
    telegram_username: z.string().trim().max(50).optional().or(z.literal("")),
  })
  .strict();

export const notificationPatchSchema = z
  .object({
    ids: z.array(z.string().trim().min(1)).max(100).optional(),
    all: z.boolean().optional(),
  })
  .strict();

export const revisionRequestSchema = z
  .object({
    notes: compactText(5_000, "Revision notes", 1),
  })
  .strict();

export async function parseBody<T>(request: Request, schema: z.ZodType<T>) {
  try {
    return { data: schema.parse(await request.json()) } as const;
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message || "Invalid request payload"
        : "Invalid JSON request";
    return { error: message } as const;
  }
}
