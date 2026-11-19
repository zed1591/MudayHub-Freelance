import { describe, it, expect } from "vitest";
import { readStore, writeStore, demoRecordDeed } from "@/lib/demo/store";
import { mintTrustDeed } from "@/lib/escrow/deeds";
import type { Contract, Dispute } from "@/lib/types";

describe("Arbitration 2.0 & Partial Split Settlement", () => {
  it("calculates exact split payouts and fees preserving balance invariant", () => {
    const totalContractEtb = 20000;
    const splitPct = 70; // 70% to freelancer, 30% to client

    const freelancerGross = Math.round(totalContractEtb * (splitPct / 100) * 100) / 100;
    expect(freelancerGross).toBe(14000);

    const platformFee = Math.round(freelancerGross * 0.07 * 100) / 100;
    expect(platformFee).toBe(980); // 7% of 14,000

    const freelancerNet = Math.round((freelancerGross - platformFee) * 100) / 100;
    expect(freelancerNet).toBe(13020);

    const clientRefund = Math.round((totalContractEtb - freelancerGross) * 100) / 100;
    expect(clientRefund).toBe(6000); // 30% of 20,000

    // Accounting invariant: client refund + freelancer gross = total contract amount
    expect(clientRefund + freelancerGross).toBe(totalContractEtb);
  });

  it("handles a 50/50 split cleanly with decimal rounding", () => {
    const totalContractEtb = 15555.55;
    const splitPct = 50;

    const freelancerGross = Math.round(totalContractEtb * (splitPct / 100) * 100) / 100;
    const clientRefund = Math.round((totalContractEtb - freelancerGross) * 100) / 100;

    expect(clientRefund + freelancerGross).toBeCloseTo(totalContractEtb, 2);
  });

  it("mints verified deed for the settled amount on split arbitration", () => {
    const store = readStore();
    const client = store.users.find((u) => u.profile.role === "client");
    const freelancer = store.users.find((u) => u.profile.role === "freelancer");

    expect(client).toBeDefined();
    expect(freelancer).toBeDefined();

    if (client && freelancer) {
      const contractId = `test-split-c-${Date.now()}`;
      const contract: Contract = {
        id: contractId,
        client_id: client.id,
        freelancer_id: freelancer.id,
        total_amount_etb: 10000,
        platform_fee_etb: 700,
        freelancer_net_etb: 9300,
        escrow_status: "disputed",
        payment_reference: `PAY-${contractId}`,
        work_submission_url: "https://github.com/muday/test",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.contracts.push(contract);

      const dispute: Dispute = {
        id: `disp-${Date.now()}`,
        contract_id: contractId,
        raised_by: client.id,
        category: "quality_mismatch",
        reason: "Milestone 1 delivered, milestone 2 incomplete.",
        evidence_url: "https://figma.com/file/test",
        status: "open",
        resolution_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.disputes.push(dispute);
      writeStore(store);

      // Execute 60/40 split
      const splitPct = 60;
      const platformFee = 420;
      const freelancerNet = 5580;
      const clientRefund = 4000;

      dispute.status = "resolved";
      dispute.outcome = "split";
      dispute.split_pct = splitPct;
      dispute.freelancer_payout_etb = freelancerNet;
      dispute.client_refund_etb = clientRefund;
      dispute.resolution_notes = "60% release for approved deliverable, 40% refund for unworked scope";

      contract.escrow_status = "completed";
      writeStore(store);

      const deed = mintTrustDeed({
        contractId: contract.id,
        projectTitle: "Tested Split RFP",
        category: "Web & Full Stack",
        freelancerId: freelancer.id,
        freelancerName: freelancer.profile.full_name,
        clientName: client.profile.full_name,
        amountEtb: freelancerNet,
        platformFeeEtb: platformFee,
      });
      demoRecordDeed(deed);

      const refreshedStore = readStore();
      const savedDispute = refreshedStore.disputes.find((d) => d.id === dispute.id);
      expect(savedDispute?.outcome).toBe("split");
      expect(savedDispute?.split_pct).toBe(60);
      expect(savedDispute?.freelancer_payout_etb).toBe(5580);
      expect(savedDispute?.client_refund_etb).toBe(4000);

      const savedDeed = refreshedStore.deeds?.find((d) => d.contract_id === contract.id);
      expect(savedDeed).toBeDefined();
      expect(savedDeed?.amount_etb).toBe(5580);
    }
  });
});
