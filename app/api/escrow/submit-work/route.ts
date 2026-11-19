import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { assertTransition } from "@/lib/escrow/state-machine";
import { isDemoMode } from "@/lib/demo/mode";
import { pushNotification, readStore, writeStore } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { escrowSubmitWorkSchema, parseBody } from "@/lib/security/validation";
import { recordSecurityEvent } from "@/lib/security/audit";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, escrowSubmitWorkSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { contractId, work_submission_url, work_submission_notes } = parsed.data;

  if (isDemoMode()) {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === contractId);
    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (contract.freelancer_id !== user.id) {
      return NextResponse.json({ error: "Only freelancer can submit" }, { status: 403 });
    }
    try {
      assertTransition(contract.escrow_status, "work_submitted");
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid" },
        { status: 400 }
      );
    }
    contract.work_submission_url = work_submission_url;
    if (work_submission_notes) contract.work_submission_notes = work_submission_notes;
    contract.escrow_status = "work_submitted";
    contract.updated_at = new Date().toISOString();
    pushNotification(store, contract.client_id, {
      title: "Work submitted",
      body: "Review deliverables within 72 hours.",
      link: `/contracts/${contract.id}`,
    });
    writeStore(store);

    await recordSecurityEvent({
      actorId: user.id,
      eventType: "escrow.work.submitted",
      metadata: { contractId, deliverableUrl: work_submission_url },
    });

    return NextResponse.json({ contract });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("submit_contract_work", {
    p_contract: contractId,
    p_actor: user.id,
    p_url: work_submission_url.trim(),
    p_notes: work_submission_notes?.trim() || "",
  });
  if (error || !data) {
    const message = error?.message || "Unable to submit work";
    const status = /not found/i.test(message) ? 404 : /not authorized|only the freelancer/i.test(message) ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  await recordSecurityEvent({
    actorId: user.id,
    eventType: "escrow.work.submitted",
    metadata: { contractId, deliverableUrl: work_submission_url },
  });

  return NextResponse.json({ contract: data });
}
