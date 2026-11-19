import { PLATFORM_FEE_RATE } from "@/lib/types";

export function splitEscrowAmount(totalAmountEtb: number) {
  if (totalAmountEtb <= 0) {
    throw new Error("Escrow amount must be positive");
  }
  const platform_fee_etb = Math.round(totalAmountEtb * PLATFORM_FEE_RATE * 100) / 100;
  const freelancer_net_etb =
    Math.round((totalAmountEtb - platform_fee_etb) * 100) / 100;
  return { platform_fee_etb, freelancer_net_etb, feeRate: PLATFORM_FEE_RATE };
}
