export interface CheckoutSession {
  checkoutUrl: string;
  reference: string;
  provider: "mock" | "chapa" | "telebirr";
}

export interface PayoutResult {
  success: boolean;
  provider: "mock" | "chapa" | "telebirr";
  transferId: string;
  amountEtb: number;
  destination: string;
}

export interface RefundResult {
  success: boolean;
  provider: "mock" | "chapa" | "telebirr";
  transferId: string;
  amountEtb: number;
}

export interface PaymentGateway {
  name: "mock" | "chapa" | "telebirr";
  supportsPayout: boolean;
  supportsRefund: boolean;
  createCheckout(params: {
    amountEtb: number;
    reference: string;
    email: string;
    returnUrl: string;
    callbackUrl: string;
  }): Promise<CheckoutSession>;
  verifyWebhook(rawBody: string, signature: string | string[] | null): boolean;
  parseWebhook(rawBody: string): { reference: string; paid: boolean; amountEtb: number };
  verifyPayment(reference: string): Promise<{ reference: string; paid: boolean; amountEtb: number; currency: string }>;
  payout(params: {
    amountEtb: number;
    telebirrNumber: string;
    reference: string;
  }): Promise<PayoutResult>;
  refund(params: {
    amountEtb: number;
    reference: string;
  }): Promise<RefundResult>;
}
