import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/lib/auth/session";
import { assertTransition } from "@/lib/escrow/state-machine";
import { isDemoMode } from "@/lib/demo/mode";
import { pushNotification, readStore, writeStore } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { escrowDisputeSchema, parseBody } from "@/lib/security/validation";
import { recordSecurityEvent } from "@/lib/security/audit";
import type { Dispute } from "@/lib/types";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, escrowDisputeSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (isDemoMode()) {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === body.contractId);
    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (contract.client_id !== user.id && contract.freelancer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
      assertTransition(contract.escrow_status, "disputed");
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid" },
        { status: 400 }
      );
    }
    contract.escrow_status = "disputed";
    contract.updated_at = new Date().toISOString();
    const dispute: Dispute = {
      id: randomUUID(),
      contract_id: contract.id,
      raised_by: user.id,
      category: body.category || "other",
      reason: body.reason,
      evidence_url: body.evidence_url || null,
      evidence_notes: body.evidence_notes || null,
      status: "open",
      resolution_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.disputes.push(dispute);

    const other =
      contract.client_id === user.id ? contract.freelancer_id : contract.client_id;
    pushNotification(store, other, {
      title: "Dispute raised",
      body: body.reason,
      link: `/contracts/${contract.id}`,
    });
    const admins = store.users.filter((u) => u.profile.role === "admin");
    admins.forEach((a) =>
      pushNotification(store, a.id, {
        title: "New dispute case",
        body: `Contract ${contract.id.slice(0, 8)}… needs review`,
        link: `/admin/disputes`,
      })
    );
    writeStore(store);

    await recordSecurityEvent({
      actorId: user.id,
      eventType: "escrow.dispute.opened",
      metadata: { contractId: body.contractId, disputeId: dispute.id, reason: body.reason },
    });

    return NextResponse.json({ dispute, contract });
  }

  const admin = createAdminClient();
  const { data: dispute, error } = await admin.rpc("raise_contract_dispute", {
    p_contract: body.contractId,
    p_actor: user.id,
    p_reason: body.reason.trim(),
    p_evidence: body.evidence_url?.trim() || null,
  });
  if (error || !dispute) {
    const message = error?.message || "Unable to open dispute";
    const status = /not found/i.test(message) ? 404 : /not authorized/i.test(message) ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  await recordSecurityEvent({
    actorId: user.id,
    eventType: "escrow.dispute.opened",
    metadata: { contractId: body.contractId, disputeId: dispute.id, reason: body.reason },
  });

  return NextResponse.json({ dispute });
}
