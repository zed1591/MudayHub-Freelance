export type UserRole = "client" | "freelancer" | "admin";
export type JobStatus = "open" | "in_progress" | "completed" | "cancelled";
export type ProposalStatus = "pending" | "accepted" | "rejected";
export type EscrowStatus =
  | "awaiting_deposit"
  | "funded"
  | "work_submitted"
  | "completed"
  | "disputed"
  | "refunded";
export type DisputeStatus = "open" | "under_review" | "resolved";

export interface PastProject {
  id?: string;
  title: string;
  description: string;
  link?: string;
  tags?: string[];
}

export interface ExperienceItem {
  id?: string;
  title: string;
  company: string;
  duration: string;
  description?: string;
}

export interface EducationItem {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export interface CertificationItem {
  id?: string;
  name: string;
  issuer: string;
  year?: string;
  credential_url?: string;
}

export type PaymentMethodType = "telebirr" | "cbe_birr" | "bank_transfer" | "card";

export interface BankAccountDetails {
  bank_name: string;
  account_number: string;
  account_holder_name: string;
}

export interface PaymentMethodItem {
  id: string;
  type: PaymentMethodType;
  title: string;
  account_identifier: string;
  bank_details?: BankAccountDetails;
  is_default?: boolean;
  created_at?: string;
}

export const ETHIOPIAN_BANKS = [
  "Commercial Bank of Ethiopia (CBE) / የኢትዮጵያ ንግድ ባንክ",
  "Awash Bank / አዋሽ ባንክ",
  "Bank of Abyssinia / የአቢሲንያ ባንክ",
  "Dashen Bank / ዳሽን ባንክ",
  "Cooperative Bank of Oromia (Coop)",
  "Hibret Bank / ኅብረት ባንክ",
  "Nib International Bank / ንብ ባንክ",
  "Wegagen Bank / ወጋገን ባንክ",
  "Zemen Bank / ዘመን ባንክ",
  "Oromia Bank",
  "Berhan Bank",
  "Sinqee Bank",
  "Global Bank Ethiopia",
  "Enat Bank",
  "Amhara Bank",
  "Hijra Bank",
  "ZamZam Bank",
  "Telebirr Mobile Wallet",
] as const;

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  headline?: string | null;
  avatar_url?: string | null;
  phone: string | null;
  bio: string;
  skills: string[];
  telebirr_number: string | null;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  linkedin_url?: string | null;
  past_projects?: PastProject[];
  experience?: ExperienceItem[];
  education?: EducationItem[];
  certifications?: CertificationItem[];
  payment_methods?: PaymentMethodItem[];
  rating: number;
  is_verified: boolean;
  created_at: string;
}

export interface SessionUser {
  id: string;
  email: string;
  profile: Profile;
}

export interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  budget_etb: number;
  status: JobStatus;
  skills: string[];
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "is_verified" | "rating" | "created_at">;
}

export interface Proposal {
  id: string;
  job_id: string;
  freelancer_id: string;
  bid_amount_etb: number;
  duration_days: number;
  cover_letter: string;
  status: ProposalStatus;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "rating" | "is_verified" | "skills">;
  jobs?: Pick<Job, "title" | "budget_etb" | "client_id" | "status">;
}

export interface GigPackage {
  name: "basic" | "standard" | "premium";
  title: string;
  description: string;
  price_etb: number;
  delivery_days: number;
  revisions: number;
  features: string[];
}

export interface Gig {
  id: string;
  freelancer_id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  cover_image: string;
  gallery: string[];
  tags: string[];
  packages: {
    basic: GigPackage;
    standard: GigPackage;
    premium: GigPackage;
  };
  rating: number;
  reviews_count: number;
  orders_completed: number;
  is_published?: boolean;
  created_at: string;
  freelancer?: Pick<Profile, "id" | "full_name" | "rating" | "is_verified" | "skills" | "bio" | "phone">;
}

export interface Review {
  id: string;
  contract_id: string;
  author_id: string;
  target_id: string;
  gig_id?: string;
  rating: number;
  comment: string;
  created_at: string;
  author?: Pick<Profile, "full_name" | "role">;
}

export type MilestoneStatus =
  | "locked"
  | "funded"
  | "work_submitted"
  | "completed"
  | "disputed"
  | "refunded";

export interface Milestone {
  id: string;
  contract_id: string;
  ordinal: number;
  title: string;
  description?: string;
  amount_etb: number;
  due_days?: number;
  status: MilestoneStatus;
  submission_url?: string;
  submission_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type PayoutEntryType =
  | "deposit"
  | "escrow_lock"
  | "platform_fee"
  | "freelancer_payout"
  | "refund";

export interface PayoutLedgerEntry {
  id: string;
  contract_id: string;
  milestone_id?: string | null;
  entry_type: PayoutEntryType;
  amount_etb: number;
  currency: string;
  provider: string;
  provider_reference?: string | null;
  destination_account?: string | null;
  actor_id?: string | null;
  created_at: string;
}

export interface Contract {
  id: string;
  job_id?: string;
  gig_id?: string;
  package_tier?: "basic" | "standard" | "premium";
  proposal_id?: string;
  client_id: string;
  freelancer_id: string;
  total_amount_etb: number;
  platform_fee_etb: number;
  freelancer_net_etb: number;
  escrow_status: EscrowStatus;
  payment_reference: string | null;
  work_submission_url: string | null;
  work_submission_notes?: string | null;
  revisions_remaining?: number;
  revision_requested?: boolean;
  revision_notes?: string | null;
  milestones?: Milestone[];
  reviews?: Review[];
  deed_hash?: string | null;
  created_at: string;
  updated_at: string;
  jobs?: Pick<Job, "title" | "category">;
  gigs?: Pick<Gig, "title" | "category" | "cover_image">;
  client?: Pick<Profile, "full_name" | "phone">;
  freelancer?: Pick<Profile, "full_name" | "telebirr_number">;
}

export type DisputeCategory =
  | "missed_deadline"
  | "scope_creep"
  | "quality_mismatch"
  | "unresponsive"
  | "breach_of_terms"
  | "other";

export const DISPUTE_CATEGORIES: Record<
  DisputeCategory,
  { label: string; amharic: string; description: string }
> = {
  missed_deadline: {
    label: "Missed Deadline",
    amharic: "የጊዜ ገደብ ማለፍ",
    description: "Milestone or project deadline lapsed without agreed delivery or extension.",
  },
  scope_creep: {
    label: "Scope Creep / Extra Demands",
    amharic: "የሥራ ወሰን መዛባት",
    description: "Requests outside the agreed contract or proposal specification.",
  },
  quality_mismatch: {
    label: "Quality / Spec Mismatch",
    amharic: "ጥራት ወይም መስፈርት አለመጠበቅ",
    description: "Deliverables do not match agreed acceptance criteria, Figma design, or code requirements.",
  },
  unresponsive: {
    label: "Unresponsive Counterparty",
    amharic: "ምላሽ አለመስጠት",
    description: "Counterparty has been silent or uncontactable for more than 48-72 hours.",
  },
  breach_of_terms: {
    label: "Breach of Platform Terms",
    amharic: "የመመሪያ ጥሰት",
    description: "Attempted disintermediation, off-platform communication, or inappropriate conduct.",
  },
  other: {
    label: "Other Dispute",
    amharic: "ሌላ",
    description: "Other substantive disagreement requiring neutral third-party arbitration.",
  },
};

export interface Dispute {
  id: string;
  contract_id: string;
  raised_by: string;
  category?: DisputeCategory;
  reason: string;
  evidence_url: string | null;
  evidence_notes?: string | null;
  status: DisputeStatus;
  resolution_notes: string | null;
  outcome?: "release" | "refund" | "split";
  split_pct?: number; // percentage allocated to freelancer (1-99)
  freelancer_payout_etb?: number;
  client_refund_etb?: number;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorklogEntry {
  id: string;
  contract_id: string;
  milestone_id?: string | null;
  author_id: string;
  title: string;
  description: string;
  hours_spent?: number;
  deliverable_url?: string;
  status: "submitted" | "approved" | "needs_revision";
  feedback?: string;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, "full_name" | "avatar_url" | "role">;
}

export interface TrustDeed {
  id: string;
  deed_hash: string;
  contract_id: string;
  job_id?: string;
  gig_id?: string;
  project_title: string;
  category: string;
  freelancer_id: string;
  freelancer_name: string;
  client_name?: string;
  amount_etb: number;
  platform_fee_etb: number;
  milestone_count: number;
  completed_at: string;
  signature: string; // HMAC-SHA256 signature
}

export interface Message {
  id: string;
  contract_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export * from "./categories";

export const GIG_CATEGORIES = [
  "Web & Full Stack",
  "UI/UX & Product Design",
  "Mobile App Development",
  "Brand Identity & Graphics",
  "Translation & Localization",
  "DevOps & Cloud",
  "Cybersecurity & Auditing",
  "AI & Data Science",
] as const;

export const PLATFORM_FEE_RATE = 0.07;

/** Shape returned by /api/auth/me as `user` (or null when signed out). */
export interface SessionUser {
  id: string;
  email: string;
  profile: Profile;
}

export interface StoredUpload {
  id: string;
  contract_id: string;
  original_name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
  uploader_id: string;
  purpose: "deliverable" | "dispute_evidence" | "general";
  created_at: string;
}

