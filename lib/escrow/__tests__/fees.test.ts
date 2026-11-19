import { describe, it, expect } from "vitest";
import { splitEscrowAmount } from "../fees";

describe("Escrow Fee Calculations", () => {
  it("computes exactly 7% platform fee and 93% net payout", () => {
    const total = 10000;
    const { platform_fee_etb, freelancer_net_etb, feeRate } = splitEscrowAmount(total);

    expect(feeRate).toBe(0.07);
    expect(platform_fee_etb).toBe(700);
    expect(freelancer_net_etb).toBe(9300);
    expect(platform_fee_etb + freelancer_net_etb).toBe(total);
  });

  it("handles fractional cents rounding properly", () => {
    const total = 1234.56;
    const { platform_fee_etb, freelancer_net_etb } = splitEscrowAmount(total);

    // 1234.56 * 0.07 = 86.4192 -> 86.42
    expect(platform_fee_etb).toBe(86.42);
    // 1234.56 - 86.42 = 1148.14
    expect(freelancer_net_etb).toBe(1148.14);
    expect(platform_fee_etb + freelancer_net_etb).toBeCloseTo(total, 2);
  });

  it("throws error for zero or negative amount", () => {
    expect(() => splitEscrowAmount(0)).toThrow("Escrow amount must be positive");
    expect(() => splitEscrowAmount(-500)).toThrow("Escrow amount must be positive");
  });
});
