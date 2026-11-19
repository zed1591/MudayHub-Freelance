import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoAddWorklog, demoFindWorklogs, readStore } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseBody, worklogCreateSchema } from "@/lib/security/validation";
import { recordSecurityEvent } from "@/lib/security/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDemoMode()) {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === contractId);
    if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    if (
      contract.client_id !== user.id &&
      contract.freelancer_id !== user.id &&
      user.profile.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const worklogs = demoFindWorklogs(contractId);
    return NextResponse.json({ worklogs });
  }

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("contracts")
    .select("client_id, freelancer_id")
    .eq("id", contractId)
    .single();

  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (
    contract.client_id !== user.id &&
    contract.freelancer_id !== user.id &&
    user.profile.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: worklogs, error } = await admin
    .from("worklogs")
    .select("*, profiles:author_id(full_name, avatar_url, role)")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ worklogs });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, worklogCreateSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (body.contractId !== contractId) {
    return NextResponse.json({ error: "Contract ID mismatch" }, { status: 400 });
  }

  if (isDemoMode()) {
    try {
      const worklog = demoAddWorklog({
        contractId,
        milestoneId: body.milestoneId || null,
        authorId: user.id,
        title: body.title,
        description: body.description,
        hoursSpent: body.hours_spent,
        deliverableUrl: body.deliverable_url,
      });

      await recordSecurityEvent({
        actorId: user.id,
        eventType: "contract.worklog.created",
        metadata: { contractId, worklogId: worklog.id, title: body.title },
      });

      return NextResponse.json({ worklog }, { status: 201 });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed to create worklog" },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("contracts")
    .select("client_id, freelancer_id")
    .eq("id", contractId)
    .single();

  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (contract.freelancer_id !== user.id && contract.client_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: worklog, error } = await admin
    .from("worklogs")
    .insert({
      contract_id: contractId,
      milestone_id: body.milestoneId || null,
      author_id: user.id,
      title: body.title,
      description: body.description,
      hours_spent: body.hours_spent || null,
      deliverable_url: body.deliverable_url || null,
      status: "submitted",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordSecurityEvent({
    actorId: user.id,
    eventType: "contract.worklog.created",
    metadata: { contractId, worklogId: worklog.id, title: body.title },
  });

  return NextResponse.json({ worklog }, { status: 201 });
}
