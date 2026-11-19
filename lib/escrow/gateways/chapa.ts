import crypto from "crypto";
import type { PaymentGateway } from "./types";

const SECRET = process.env.CHAPA_WEBHOOK_SECRET || process.env.ESCROW_WEBHOOK_SECRET || "";
const SECRET_KEY = process.env.CHAPA_SECRET_KEY || "";
const TELEBIRR_BANK_CODE = process.env.CHAPA_TELEBIRR_BANK_CODE || "853";

export const chapaGateway: PaymentGateway = {
  name: "chapa",

  get supportsPayout(): boolean {
    return Boolean(
      SECRET_KEY &&
        (process.env.CHAPA_ENABLE_PAYOUTS === "true" ||
          process.env.ENABLE_AUTOMATED_PAYOUTS === "true")
    );
  },

  get supportsRefund(): boolean {
    return Boolean(
      SECRET_KEY &&
        (process.env.CHAPA_ENABLE_REFUNDS === "true" ||
          process.env.ENABLE_AUTOMATED_REFUNDS === "true" ||
          process.env.CHAPA_ENABLE_PAYOUTS === "true")
    );
  },

  async createCheckout({ amountEtb, reference, email, returnUrl, callbackUrl }) {
    if (!SECRET_KEY) {
      throw new Error("CHAPA_SECRET_KEY is not configured");
    }
    const res = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: String(amountEtb),
        currency: "ETB",
        email,
        tx_ref: reference,
        callback_url: callbackUrl,
        return_url: returnUrl,
        customization: {
          title: "MudayHub Escrow",
          description: "Contract escrow deposit",
        },
      }),
    });
    const json = (await res.json()) as {
      status: string;
      data?: { checkout_url?: string };
      message?: string;
    };
    if (!res.ok || !json.data?.checkout_url) {
      throw new Error(json.message || "Chapa checkout failed");
    }
    return {
      checkoutUrl: json.data.checkout_url,
      reference,
      provider: "chapa",
    };
  },

  verifyWebhook(rawBody, signature) {
    if (!SECRET || !signature) return false;
    const signatures = Array.isArray(signature) ? signature : [signature];
    let signedPayload = rawBody;
    try {
      signedPayload = JSON.stringify(JSON.parse(rawBody));
    } catch {
      return false;
    }
    const payloadHash = crypto.createHmac("sha256", SECRET).update(signedPayload).digest("hex");
    return signatures.some((value) => constantTimeEqual(payloadHash, value));
  },

  // Chapa's webhook signature is an origin check. Their API verification
  // endpoint is the source of truth for paid status, amount, and currency.
  async verifyPayment(reference) {
    if (!SECRET_KEY) throw new Error("CHAPA_SECRET_KEY is not configured");
    const response = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${SECRET_KEY}` },
        cache: "no-store",
      }
    );
    const result = (await response.json()) as {
      status?: string;
      data?: {
        status?: string;
        tx_ref?: string;
        amount?: string | number;
        currency?: string;
      };
    };
    if (!response.ok || !result.data) throw new Error("Chapa transaction verification failed");
    return {
      reference: result.data.tx_ref || reference,
      paid: (result.data.status || result.status || "").toLowerCase() === "success",
      amountEtb: Number(result.data.amount),
      currency: result.data.currency || "",
    };
  },

  parseWebhook(rawBody) {
    const data = JSON.parse(rawBody) as {
      tx_ref?: string;
      reference?: string;
      status?: string;
      amount?: number | string;
    };
    return {
      reference: data.tx_ref || data.reference || "",
      paid: (data.status || "").toLowerCase() === "success",
      amountEtb: Number(data.amount || 0),
    };
  },

  async payout({ amountEtb, telebirrNumber, reference }) {
    if (!SECRET_KEY || !this.supportsPayout) {
      return {
        success: false,
        provider: "chapa",
        transferId: `unsupported-${reference}`,
        amountEtb,
        destination: telebirrNumber,
      };
    }

    try {
      // Normalize destination phone to standard format (e.g. 09... or +251...)
      const cleanedPhone = telebirrNumber.replace(/\s+/g, "");
      const res = await fetch("https://api.chapa.co/v1/transfers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_name: "MudayHub Freelancer",
          account_number: cleanedPhone,
          amount: String(amountEtb),
          currency: "ETB",
          reference: `payout-${reference}`,
          bank_code: TELEBIRR_BANK_CODE,
        }),
      });

      const data = (await res.json()) as {
        status?: string;
        message?: string;
        data?: { id?: string; reference?: string };
      };

      const isSuccess = res.ok && (data.status || "").toLowerCase() === "success";
      return {
        success: isSuccess,
        provider: "chapa",
        transferId: data.data?.reference || data.data?.id || `payout-${reference}`,
        amountEtb,
        destination: telebirrNumber,
      };
    } catch {
      return {
        success: false,
        provider: "chapa",
        transferId: `error-${reference}`,
        amountEtb,
        destination: telebirrNumber,
      };
    }
  },

  async refund({ amountEtb, reference }) {
    if (!SECRET_KEY || !this.supportsRefund) {
      return {
        success: false,
        provider: "chapa",
        transferId: `unsupported-refund-${reference}`,
        amountEtb,
      };
    }

    try {
      const res = await fetch("https://api.chapa.co/v1/transaction/refund", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_reference: reference,
          amount: String(amountEtb),
          reason: "Escrow arbitration refund",
        }),
      });

      const data = (await res.json()) as {
        status?: string;
        message?: string;
        data?: { id?: string };
      };

      const isSuccess = res.ok && (data.status || "").toLowerCase() === "success";
      return {
        success: isSuccess,
        provider: "chapa",
        transferId: data.data?.id || `refund-${reference}`,
        amountEtb,
      };
    } catch {
      return {
        success: false,
        provider: "chapa",
        transferId: `error-refund-${reference}`,
        amountEtb,
      };
    }
  },
};

function constantTimeEqual(expected: string, supplied: string | null): boolean {
  if (!supplied) return false;
  const expectedBuffer = Buffer.from(expected, "hex");
  const suppliedBuffer = Buffer.from(supplied, "hex");
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    expectedBuffer.length > 0 &&
    crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}
