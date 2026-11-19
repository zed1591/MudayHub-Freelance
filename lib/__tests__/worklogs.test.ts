import { describe, it, expect } from "vitest";
import {
  demoAddWorklog,
  demoReviewWorklog,
  demoFindWorklogs,
  readStore,
  writeStore,
} from "@/lib/demo/store";
import type { Contract } from "@/lib/types";

describe("Worklog Feed & Deliverable Progress Checkpoints", () => {
  it("allows specialist to submit intermediate work progress updates", () => {
    const store = readStore();
    const client = store.users.find((u) => u.profile.role === "client");
    const freelancer = store.users.find((u) => u.profile.role === "freelancer");

    expect(client).toBeDefined();
    expect(freelancer).toBeDefined();

    if (client && freelancer) {
      const contractId = `test-wl-c-${Date.now()}`;
      const contract: Contract = {
        id: contractId,
        client_id: client.id,
        freelancer_id: freelancer.id,
        total_amount_etb: 15000,
        platform_fee_etb: 1050,
        freelancer_net_etb: 13950,
        escrow_status: "funded",
        payment_reference: `PAY-${contractId}`,
        work_submission_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.contracts.push(contract);
      writeStore(store);

      const entry = demoAddWorklog({
        contractId,
        authorId: freelancer.id,
        title: "Setup Auth Routes & Database Schema",
        description: "Configured Next.js middleware, session cookies, and Supabase migrations.",
        hoursSpent: 5.5,
        deliverableUrl: "https://github.com/muday/commit/abc1234",
      });

      expect(entry.id).toMatch(/^wl-/);
      expect(entry.title).toBe("Setup Auth Routes & Database Schema");
      expect(entry.status).toBe("submitted");
      expect(entry.hours_spent).toBe(5.5);

      const fetched = demoFindWorklogs(contractId);
      expect(fetched.length).toBeGreaterThanOrEqual(1);
      const found = fetched.find((w) => w.id === entry.id);
      expect(found).toBeDefined();
      expect(found?.author?.full_name).toBe(freelancer.profile.full_name);
    }
  });

  it("allows client to review and approve worklogs", () => {
    const store = readStore();
    const client = store.users.find((u) => u.profile.role === "client");
    const freelancer = store.users.find((u) => u.profile.role === "freelancer");

    if (client && freelancer) {
      const contractId = `test-wl-review-${Date.now()}`;
      const contract: Contract = {
        id: contractId,
        client_id: client.id,
        freelancer_id: freelancer.id,
        total_amount_etb: 8000,
        platform_fee_etb: 560,
        freelancer_net_etb: 7440,
        escrow_status: "funded",
        payment_reference: `PAY-${contractId}`,
        work_submission_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.contracts.push(contract);
      writeStore(store);

      const entry = demoAddWorklog({
        contractId,
        authorId: freelancer.id,
        title: "Figma Wireframes Delivered",
        description: "Shared initial high-fidelity mockups for feedback.",
        deliverableUrl: "https://figma.com/file/mockup",
      });

      const reviewed = demoReviewWorklog({
        worklogId: entry.id,
        reviewerId: client.id,
        status: "approved",
        feedback: "Looks clean, proceed to implementation!",
      });

      expect(reviewed.status).toBe("approved");
      expect(reviewed.feedback).toBe("Looks clean, proceed to implementation!");

      const fetched = demoFindWorklogs(contractId);
      const found = fetched.find((w) => w.id === entry.id);
      expect(found?.status).toBe("approved");
    }
  });

  it("blocks non-participants from adding worklogs", () => {
    expect(() =>
      demoAddWorklog({
        contractId: "non-existent-contract-id",
        authorId: "random-user-id",
        title: "Intruder Update",
        description: "Should fail authorization",
      })
    ).toThrow("Contract not found");
  });
});
