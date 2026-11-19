import { NextResponse } from "next/server";
import { assertTransition } from "@/lib/escrow/state-machine";
import { getPaymentGateway } from "@/lib/escrow/gateways";
import { isDemoMode } from "@/lib/demo/mode";
import { pushNotification, readStore, writeStore } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSecurityEvent } from "@/lib/security/audit";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = [
    req.headers.get("chapa-signature"),
    req.headers.get("x-chapa-signature"),
    req.headers.get("x-mudayhub-signature"),
  ].filter((value): value is string => Boolean(value));

  let gateway;
  try {
    gateway = getPaymentGateway();
  } catch {
    return NextResponse.json({ error: "Payment provider is unavailable" }, { status: 503 });
  }
  if (!gateway.verifyWebhook(rawBody, signature)) {
    await recordSecurityEvent({
      eventType: "escrow.webhook.invalid_signature",
      metadata: { provider: gateway.name },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = gateway.parseWebhook(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payment event" }, { status: 400 });
  }
  if (!parsed.paid || !parsed.reference) {
    return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
  }

  if (isDemoMode()) {
    const store = readStore();
    const contract = store.contracts.find(
      (c) => c.payment_reference === parsed.reference || c.id === parsed.reference
    );
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    if (Number(contract.total_amount_etb) !== parsed.amountEtb) {
      await recordSecurityEvent({
        eventType: "escrow.webhook.amount_mismatch",
        metadata: {
          contractId: contract.id,
          expected: Number(contract.total_amount_etb),
          received: parsed.amountEtb,
        },
      });
      return NextResponse.json({ error: "Payment amount does not match contract" }, { status: 400 });
    }
    if (contract.escrow_status === "funded") {
      return NextResponse.json({ ok: true, status: "funded" });
    }
    try {
      assertTransition(contract.escrow_status, "funded");
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid transition" },
        { status: 400 }
      );
    }
    contract.escrow_status = "funded";
    contract.updated_at = new Date().toISOString();
    pushNotification(store, contract.freelancer_id, {
      title: "Escrow funded",
      body: "Funds are locked. You can safely start work.",
      link: `/contracts/${contract.id}`,
    });
    pushNotification(store, contract.client_id, {
      title: "Deposit confirmed",
      body: `${parsed.amountEtb} ETB secured in escrow.`,
      link: `/contracts/${contract.id}`,
    });
    writeStore(store);

    await recordSecurityEvent({
      eventType: "escrow.webhook.verified",
      metadata: { contractId: contract.id, amountEtb: parsed.amountEtb, reference: parsed.reference },
    });

    return NextResponse.json({ ok: true, status: "funded" });
  }

  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("contracts")
    .select("id,total_amount_etb,escrow_status")
    .eq("payment_reference", parsed.reference)
    .maybeSingle();
  if (!pending) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (pending.escrow_status !== "awaiting_deposit") {
    // Chapa retries webhook deliveries. Acknowledge already handled payments.
    return NextResponse.json({ ok: true, status: pending.escrow_status });
  }

  let verified;
  try {
    verified = await gateway.verifyPayment(parsed.reference);
  } catch {
    return NextResponse.json({ error: "Payment verification is temporarily unavailable" }, { status: 503 });
  }
  if (
    !verified.paid ||
    verified.reference !== parsed.reference ||
    verified.currency.toUpperCase() !== "ETB" ||
    Number(verified.amountEtb) !== Number(pending.total_amount_etb)
  ) {
    await recordSecurityEvent({
      eventType: "escrow.webhook.amount_mismatch",
      metadata: {
        contractId: pending.id,
        expected: Number(pending.total_amount_etb),
        received: verified.amountEtb,
      },
    });
    return NextResponse.json({ error: "Verified payment does not match contract" }, { status: 400 });
  }

  // Atomic compare-and-swap funding: exactly one webhook may move a contract
  // to 'funded'. A concurrent duplicate loses the CAS and is rejected below,
  // so two racing webhooks can never both pass.
  const { data: updated, error: updErr } = await admin
    .from("contracts")
    .update({ escrow_status: "funded" })
    .eq("payment_reference", parsed.reference)
    .eq("escrow_status", "awaiting_deposit")
    .select("*");

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    const { data: existing } = await admin
      .from("contracts")
      .select("*")
      .eq("payment_reference", parsed.reference)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: `Not fundable from state ${existing.escrow_status}` },
      { status: 400 }
    );
  }
  const contract = updated[0];

  await admin.from("notifications").insert([
    {
      user_id: contract.freelancer_id,
      title: "Escrow funded",
      body: "Funds are locked. You can safely start work.",
      link: `/contracts/${contract.id}`,
    },
    {
      user_id: contract.client_id,
      title: "Deposit confirmed",
      body: `${parsed.amountEtb} ETB secured in escrow.`,
      link: `/contracts/${contract.id}`,
    },
  ]);

  await recordSecurityEvent({
    eventType: "escrow.webhook.verified",
    metadata: { contractId: contract.id, amountEtb: parsed.amountEtb, reference: parsed.reference },
  });

  return NextResponse.json({ ok: true, status: "funded" });
}
