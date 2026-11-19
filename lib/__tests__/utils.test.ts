import { describe, expect, it } from "vitest";
import { formatMemberSince, formatEtb, isValidPhone } from "../utils";

describe("Utility Functions", () => {
  it("formats member since month and year correctly", () => {
    expect(formatMemberSince("2026-11-06T12:00:00Z")).toBe("November 2026");
    expect(formatMemberSince("2024-05-15T08:30:00Z")).toBe("May 2024");
    expect(formatMemberSince("2023-01-01T00:00:00Z")).toBe("January 2023");
  });

  it("handles empty or invalid dates gracefully", () => {
    expect(formatMemberSince(null)).toBe("Recently");
    expect(formatMemberSince(undefined)).toBe("Recently");
    expect(formatMemberSince("invalid-date-string")).toBe("Recently");
  });

  it("validates ethiopian phone numbers", () => {
    expect(isValidPhone("+251911223344")).toBe(true);
    expect(isValidPhone("+251711223344")).toBe(true);
    expect(isValidPhone("0911223344")).toBe(false);
    expect(isValidPhone("+251811223344")).toBe(false);
  });

  it("formats ETB currency", () => {
    const formatted = formatEtb(1500);
    expect(formatted).toContain("1,500");
  });
});
