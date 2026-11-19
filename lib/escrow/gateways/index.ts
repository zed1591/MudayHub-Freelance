import { chapaGateway } from "./chapa";
import { mockGateway } from "./mock";
import type { PaymentGateway } from "./types";
import { isDemoMode } from "@/lib/demo/mode";

export function getPaymentGateway(): PaymentGateway {
  const provider = (process.env.PAYMENT_PROVIDER || "").toLowerCase();
  if (provider === "mock" && isDemoMode() && process.env.ESCROW_WEBHOOK_SECRET) return mockGateway;
  if (provider === "chapa" && !isDemoMode() && process.env.CHAPA_SECRET_KEY && process.env.CHAPA_WEBHOOK_SECRET) {
    return chapaGateway;
  }
  throw new Error("Payment provider is not configured for this environment");
}

export type { PaymentGateway, CheckoutSession, PayoutResult, RefundResult } from "./types";
export { mockGateway, signMockWebhook } from "./mock";
export { chapaGateway } from "./chapa";
