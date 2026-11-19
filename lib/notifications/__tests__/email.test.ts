import { describe, it, expect } from "vitest";
import { formatEmailHtml, sendTransactionalEmail } from "../email";

describe("Transactional Email Dispatcher", () => {
  it("formats responsive HTML email with C²SA INTEL & MudayHub branding", () => {
    const html = formatEmailHtml({
      to: "client@mudayhub.et",
      subject: "Milestone 1 Funded: 20,000 ETB in The Muday Vault",
      title: "Escrow Deposit Confirmed",
      body: "Client funded 20,000 ETB for Backend API Implementation.",
      actionLabel: "Open Contract Workspace",
      actionUrl: "/contracts/demo-contract-1",
      details: [
        { label: "Milestone", value: "Phase 1 - Database & API" },
        { label: "Total Escrow", value: "20,000 ETB" },
        { label: "Platform Fee", value: "1,400 ETB (7%)" },
        { label: "Freelancer Net", value: "18,600 ETB" },
      ],
    });

    expect(html).toContain("MUDAYHUB");
    expect(html).toContain("C&sup2;SA INTEL &middot; ESCROW OS");
    expect(html).toContain("Escrow Deposit Confirmed");
    expect(html).toContain("20,000 ETB");
    expect(html).toContain("Phase 1 - Database &amp; API");
    expect(html).toContain("Open Contract Workspace");
    expect(html).toContain("https://mudayhub.et/contracts/demo-contract-1");
  });

  it("safely escapes HTML characters in email body and titles", () => {
    const html = formatEmailHtml({
      to: "freelancer@mudayhub.et",
      subject: "Review <Alert>",
      title: "Deliverable <v1.0> Submitted",
      body: 'Check "Production Build" & test cases',
    });

    expect(html).toContain("Deliverable &lt;v1.0&gt; Submitted");
    expect(html).toContain('Check &quot;Production Build&quot; &amp; test cases');
    expect(html).not.toContain("<v1.0>");
  });

  it("simulates cleanly in dev/offline mode when API key is not configured", async () => {
    const result = await sendTransactionalEmail({
      to: "freelancer@mudayhub.et",
      subject: "Payout Released",
      title: "Telebirr Payout Successful",
      body: "18,600 ETB released to +251911223344",
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe("simulated");
  });
});
