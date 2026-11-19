import { describe, it, expect } from "vitest";
import { formatTelegramMessage, sendTelegramAlert } from "../telegram";

describe("Telegram Bot Notification Service", () => {
  it("formats rich HTML message with title, body, and action link", () => {
    const formatted = formatTelegramMessage({
      title: "The Muday Vault Deposit Secured",
      body: "Client funded 15,000 ETB for Phase 1. You may safely begin work.",
      link: "/contracts/abc-123",
    });

    expect(formatted).toContain("<b>ሙዳይ ፍሪላንስ · MudayHub Alert</b>");
    expect(formatted).toContain("<b>The Muday Vault Deposit Secured</b>");
    expect(formatted).toContain("Client funded 15,000 ETB for Phase 1");
    expect(formatted).toContain('<a href="https://mudayhub.et/contracts/abc-123">');
  });

  it("safely escapes HTML characters in titles and bodies", () => {
    const formatted = formatTelegramMessage({
      title: "Scope <Update> & Approval",
      body: 'Review "Final QA" & Telebirr integration',
    });

    expect(formatted).toContain("Scope &lt;Update&gt; &amp; Approval");
    expect(formatted).toContain('Review &quot;Final QA&quot; &amp; Telebirr integration');
    expect(formatted).not.toContain("<Update>");
  });

  it("simulates cleanly in dev/offline mode when token is absent", async () => {
    const result = await sendTelegramAlert({
      title: "Milestone Approved",
      body: "7,500 ETB released to Telebirr phone +251911223344",
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe("simulated");
  });
});
