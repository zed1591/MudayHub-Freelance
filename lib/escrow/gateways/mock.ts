import crypto from "crypto";
import type { PaymentGateway } from "./types";

// Mock payments are demo-only and require an explicit signing secret.
const SECRET = process.env.ESCROW_WEBHOOK_SECRET || "";

export const mockGateway: PaymentGateway = {
  name: "mock",
  supportsPayout: true,
  supportsRefund: true,

  async createCheckout({ amountEtb, reference, returnUrl, callbackUrl }) {
    const base =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkoutUrl = `${base}/api/escrow/mock-pay?ref=${encodeURIComponent(reference)}&amount=${amountEtb}&return=${encodeURIComponent(returnUrl)}&callback=${encodeURIComponent(callbackUrl)}`;
    return { checkoutUrl, reference, provider: "mock" };
  },

  verifyWebhook(rawBody, signature) {
    if (!SECRET || !signature) return false;
    const expected = crypto.createHmac("sha256", SECRET).update(rawBody).digest("hex");
    return (Array.isArray(signature) ? signature : [signature]).some((value) => {
      const actual = Buffer.from(value, "hex");
      const expectedBuffer = Buffer.from(expected, "hex");
      return actual.length === expectedBuffer.length && actual.length > 0 && crypto.timingSafeEqual(expectedBuffer, actual);
    });
  },

  parseWebhook(rawBody) {
    const data = JSON.parse(rawBody) as {
      tx_ref: string;
      status: string;
      amount: number;
    };
    return {
      reference: data.tx_ref,
      paid: data.status === "success",
      amountEtb: Number(data.amount),
    };
  },

  async verifyPayment(reference) {
    return { reference, paid: false, amountEtb: 0, currency: "ETB" };
  },

  async payout({ amountEtb, telebirrNumber, reference }) {
    return {
      success: true,
      provider: "mock",
      transferId: `mock-payout-${reference}`,
      amountEtb,
      destination: telebirrNumber,
    };
  },

  async refund({ amountEtb, reference }) {
    return {
      success: true,
      provider: "mock",
      transferId: `mock-refund-${reference}`,
      amountEtb,
    };
  },
};

export function signMockWebhook(body: string): string {
  if (!SECRET) throw new Error("ESCROW_WEBHOOK_SECRET is required in demo mode");
  return crypto.createHmac("sha256", SECRET).update(body).digest("hex");
}
