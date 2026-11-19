import crypto from "crypto";
import type { TrustDeed } from "@/lib/types";

const DEED_SIGNING_SECRET =
  process.env.ESCROW_WEBHOOK_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "mudayhub-sovereign-trust-deed-v1-secret-2026";

/**
 * Builds a deterministic canonical payload string for content-addressing:
 * sha256(contract_id:freelancer_id:amount_etb:completed_at:category)
 */
export function buildCanonicalDeedPayload(params: {
  contractId: string;
  freelancerId: string;
  amountEtb: number;
  completedAt: string;
  category: string;
}): string {
  return [
    params.contractId,
    params.freelancerId,
    Number(params.amountEtb).toFixed(2),
    params.completedAt,
    params.category,
  ].join(":");
}

/**
 * Mints an immutable cryptographic Trust Deed for completed engagements.
 */
export function mintTrustDeed(params: {
  contractId: string;
  jobId?: string;
  gigId?: string;
  projectTitle: string;
  category: string;
  freelancerId: string;
  freelancerName: string;
  clientName?: string;
  amountEtb: number;
  platformFeeEtb: number;
  milestoneCount?: number;
  completedAt?: string;
}): TrustDeed {
  const completedAt = params.completedAt || new Date().toISOString();
  const canonicalPayload = buildCanonicalDeedPayload({
    contractId: params.contractId,
    freelancerId: params.freelancerId,
    amountEtb: params.amountEtb,
    completedAt,
    category: params.category,
  });

  const deedHash = crypto.createHash("sha256").update(canonicalPayload).digest("hex");
  const signature = crypto
    .createHmac("sha256", DEED_SIGNING_SECRET)
    .update(deedHash)
    .digest("hex");

  return {
    id: `deed-${deedHash.slice(0, 16)}`,
    deed_hash: deedHash,
    contract_id: params.contractId,
    job_id: params.jobId,
    gig_id: params.gigId,
    project_title: params.projectTitle,
    category: params.category,
    freelancer_id: params.freelancerId,
    freelancer_name: params.freelancerName,
    client_name: params.clientName,
    amount_etb: params.amountEtb,
    platform_fee_etb: params.platformFeeEtb,
    milestone_count: params.milestoneCount || 1,
    completed_at: completedAt,
    signature,
  };
}

/**
 * Validates a Trust Deed against the cryptographic HMAC signature and canonical contents.
 */
export function verifyTrustDeed(deed: TrustDeed): {
  isValid: boolean;
  tampered: boolean;
  expectedHash: string;
  expectedSignature: string;
} {
  const canonical = buildCanonicalDeedPayload({
    contractId: deed.contract_id,
    freelancerId: deed.freelancer_id,
    amountEtb: deed.amount_etb,
    completedAt: deed.completed_at,
    category: deed.category,
  });

  const expectedHash = crypto.createHash("sha256").update(canonical).digest("hex");
  const expectedSig = crypto
    .createHmac("sha256", DEED_SIGNING_SECRET)
    .update(expectedHash)
    .digest("hex");

  const hashMatches = crypto.timingSafeEqual(
    Buffer.from(deed.deed_hash),
    Buffer.from(expectedHash)
  );

  const sigMatches =
    deed.signature.length === expectedSig.length &&
    crypto.timingSafeEqual(Buffer.from(deed.signature), Buffer.from(expectedSig));

  const isValid = hashMatches && sigMatches;

  return {
    isValid,
    tampered: !isValid,
    expectedHash,
    expectedSignature: expectedSig,
  };
}
