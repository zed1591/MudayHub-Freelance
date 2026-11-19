import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoReviewWorklog } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseBody, worklogReviewSchema } from "@/lib/security/validation";
import { recordSecurityEvent } from "@/lib/security/audit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; worklogId: string }> }
) {
  const { id: contractId, worklogId } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, worklogReviewSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (isDemoMode()) {
    try {
      const worklog = demoReviewWorklog({
        worklogId,
        reviewerId: user.id,
        status: body.status,
        feedback: body.feedback,
      });

      await recordSecurityEvent({
        actorId: user.id,
        eventType: "contract.worklog.reviewed",
        metadata: { contractId, worklogId, status: body.status },
      });

      return NextResponse.json({ worklog });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed to review worklog" },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("contracts")
    .select("client_id")
    .eq("id", contractId)
    .single();

  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (contract.client_id !== user.id && user.profile.role !== "admin") {
    return NextResponse.json({ error: "Only client can review worklogs" }, { status: 403 });
  }

  const { data: worklog, error } = await admin
    .from("worklogs")
    .update({
      status: body.status,
      feedback: body.feedback || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", worklogId)
    .eq("contract_id", contractId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordSecurityEvent({
    actorId: user.id,
    eventType: "contract.worklog.reviewed",
    metadata: { contractId, worklogId, status: body.status },
  });

  return NextResponse.json({ worklog });
}
