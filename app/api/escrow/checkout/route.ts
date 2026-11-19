import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore } from "@/lib/demo/store";
import { getPaymentGateway } from "@/lib/escrow/gateways";
import { createAdminClient } from "@/lib/supabase/admin";
import { escrowCheckoutSchema, parseBody } from "@/lib/security/validation";
import { recordSecurityEvent } from "@/lib/security/audit";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, escrowCheckoutSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { contractId } = parsed.data;

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let gateway;
  try {
    gateway = getPaymentGateway();
  } catch {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }
  if (!gateway.supportsPayout || !gateway.supportsRefund) {
    return NextResponse.json(
      { error: "Escrow payments are unavailable until payout and refund processing are configured." },
      { status: 503 }
    );
  }

  if (isDemoMode()) {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === contractId);
    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (contract.client_id !== user.id) {
      return NextResponse.json({ error: "Only client can deposit" }, { status: 403 });
    }
    if (contract.escrow_status !== "awaiting_deposit") {
      return NextResponse.json({ error: "Already funded or closed" }, { status: 400 });
    }
    const session = await gateway.createCheckout({
      amountEtb: contract.total_amount_etb,
      reference: contract.payment_reference || contract.id,
      email: user.email,
      returnUrl: `${base}/contracts/${contract.id}`,
      callbackUrl: `${base}/api/escrow/webhook`,
    });
    await recordSecurityEvent({
      actorId: user.id,
      eventType: "escrow.checkout.created",
      metadata: { contractId, amountEtb: contract.total_amount_etb, provider: gateway.name },
    });
    return NextResponse.json({ session });
  }

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single();
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (contract.client_id !== user.id) {
    return NextResponse.json({ error: "Only client can deposit" }, { status: 403 });
  }
  if (contract.escrow_status !== "awaiting_deposit") {
    return NextResponse.json({ error: "Already funded or closed" }, { status: 400 });
  }

  const session = await gateway.createCheckout({
    amountEtb: Number(contract.total_amount_etb),
    reference: contract.payment_reference,
    email: user.email,
    returnUrl: `${base}/contracts/${contract.id}`,
    callbackUrl: `${base}/api/escrow/webhook`,
  });

  await recordSecurityEvent({
    actorId: user.id,
    eventType: "escrow.checkout.created",
    metadata: { contractId, amountEtb: Number(contract.total_amount_etb), provider: gateway.name },
  });

  return NextResponse.json({ session });
}
