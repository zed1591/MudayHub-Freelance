import { describe, it, expect } from "vitest";
import {
  buildCanonicalDeedPayload,
  mintTrustDeed,
  verifyTrustDeed,
} from "@/lib/escrow/deeds";

describe("Cryptographic Trust Deeds & Verifiable Ledger", () => {
  const sampleParams = {
    contractId: "contract-123e4567-e89b-12d3-a456-426614174000",
    jobId: "job-550e8400-e29b-41d4-a716-446655440000",
    projectTitle: "Next.js & Supabase Enterprise Portal",
    category: "Web & Full Stack",
    freelancerId: "fl-11112222-3333-4444-5555-666677778888",
    freelancerName: "Abebe Kebede",
    clientName: "Fintech Ethiopia SC",
    amountEtb: 45000,
    platformFeeEtb: 3150,
    milestoneCount: 3,
    completedAt: "2026-11-08T05:00:00.000Z",
  };

  it("mints an authentic trust deed with deterministic sha256 hash and HMAC seal", () => {
    const deed = mintTrustDeed(sampleParams);

    expect(deed.id).toMatch(/^deed-[a-f0-9]{16}$/);
    expect(deed.deed_hash).toHaveLength(64); // SHA-256 hex string
    expect(deed.signature).toHaveLength(64); // HMAC-SHA256 hex string
    expect(deed.amount_etb).toBe(45000);
    expect(deed.freelancer_name).toBe("Abebe Kebede");
    expect(deed.milestone_count).toBe(3);

    // Recomputing with same parameters must produce identical deed_hash
    const deed2 = mintTrustDeed(sampleParams);
    expect(deed2.deed_hash).toBe(deed.deed_hash);
    expect(deed2.signature).toBe(deed.signature);
  });

  it("verifies an authentic trust deed successfully", () => {
    const deed = mintTrustDeed(sampleParams);
    const result = verifyTrustDeed(deed);

    expect(result.isValid).toBe(true);
    expect(result.tampered).toBe(false);
    expect(result.expectedHash).toBe(deed.deed_hash);
    expect(result.expectedSignature).toBe(deed.signature);
  });

  it("detects tampered ETB amount", () => {
    const deed = mintTrustDeed(sampleParams);

    // Attacker modifies amount from 45,000 ETB to 90,000 ETB
    const tampered = { ...deed, amount_etb: 90000 };
    const result = verifyTrustDeed(tampered);

    expect(result.isValid).toBe(false);
    expect(result.tampered).toBe(true);
  });

  it("detects forged HMAC signature", () => {
    const deed = mintTrustDeed(sampleParams);

    const forged = {
      ...deed,
      signature: "0000000000000000000000000000000000000000000000000000000000000000",
    };
    const result = verifyTrustDeed(forged);

    expect(result.isValid).toBe(false);
    expect(result.tampered).toBe(true);
  });

  it("constructs canonical payload matching strict format invariant", () => {
    const payload = buildCanonicalDeedPayload({
      contractId: "c1",
      freelancerId: "f1",
      amountEtb: 1000,
      completedAt: "2026-11-08T00:00:00Z",
      category: "Design",
    });

    expect(payload).toBe("c1:f1:1000.00:2026-11-08T00:00:00Z:Design");
  });
});
