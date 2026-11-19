import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoAcceptProposal } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Contract } from "@/lib/types";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDemoMode()) {
    try {
      const contract = demoAcceptProposal(id, user.id);
      return NextResponse.json({ contract });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed" },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();

  // Atomic, single-transaction accept: proposal flip + sibling rejections +
  // job flip + contract creation + notifications, all inside
  // public.accept_proposal() (migration 002). No partial-state windows.
  const { data, error: rpcErr } = await admin.rpc("accept_proposal", {
    p_proposal: id,
    p_actor: user.id,
  }) as { data: Contract | null; error: { message: string } | null };

  if (rpcErr || !data) {
    const msg = rpcErr?.message || "Accept failed";
    // Map Postgres-raised conditions to friendly HTTP codes
    if (msg === "Proposal not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (msg === "Not authorized") {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ contract: data });
}
