import { describe, it, expect } from "vitest";
import { redactContactInfo, shouldApplyRedaction } from "../filter";

describe("Anti-Disintermediation Content Screening", () => {
  it("redacts Ethiopian mobile numbers", () => {
    const input1 = "Call me at +251911223344 for the project";
    expect(redactContactInfo(input1).redacted).toBe(true);
    expect(redactContactInfo(input1).text).toContain("[phone redacted]");

    const input2 = "Reach out on 0912345678 or 0712345678";
    const res2 = redactContactInfo(input2);
    expect(res2.redacted).toBe(true);
    expect(res2.text).not.toContain("0912345678");
    expect(res2.text).not.toContain("0712345678");
  });

  it("redacts email addresses", () => {
    const input = "Send details to developer@example.com right now";
    const res = redactContactInfo(input);
    expect(res.redacted).toBe(true);
    expect(res.text).toContain("[email redacted]");
    expect(res.text).not.toContain("developer@example.com");
  });

  it("redacts Telegram handles and off-platform links", () => {
    const input = "Message me on telegram @ethio_dev or t.me/ethio_dev";
    const res = redactContactInfo(input);
    expect(res.redacted).toBe(true);
    expect(res.text).toContain("[handle redacted]");
    expect(res.text).toContain("[channel redacted]");
  });

  it("leaves clean operational messages untouched", () => {
    const input = "The design files are ready. Please review the typography and ochre color palette.";
    const res = redactContactInfo(input);
    expect(res.redacted).toBe(false);
    expect(res.text).toBe(input);
  });

  it("applies redaction only when contract is awaiting_deposit", () => {
    expect(shouldApplyRedaction("awaiting_deposit")).toBe(true);
    expect(shouldApplyRedaction("funded")).toBe(false);
    expect(shouldApplyRedaction("work_submitted")).toBe(false);
    expect(shouldApplyRedaction("completed")).toBe(false);
  });
});
