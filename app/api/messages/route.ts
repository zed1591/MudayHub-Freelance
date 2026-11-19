import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore, writeStore } from "@/lib/demo/store";
import { redactContactInfo, shouldApplyRedaction } from "@/lib/messaging/filter";
import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";
import { messageSchema, parseBody } from "@/lib/security/validation";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contractId = new URL(req.url).searchParams.get("contractId");
  if (!contractId) {
    return NextResponse.json({ error: "contractId required" }, { status: 400 });
  }

  if (isDemoMode()) {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === contractId);
    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (
      contract.client_id !== user.id &&
      contract.freelancer_id !== user.id &&
      user.profile.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const messages = store.messages.filter((m) => m.contract_id === contractId);
    return NextResponse.json({
      messages,
      redactionActive: shouldApplyRedaction(contract.escrow_status),
    });
  }

  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, client_id, freelancer_id, escrow_status")
    .eq("id", contractId)
    .single();

  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (
    contract.client_id !== user.id &&
    contract.freelancer_id !== user.id &&
    user.profile.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("contract_id", contractId)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    messages: data,
    redactionActive: shouldApplyRedaction(contract.escrow_status),
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, messageSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (isDemoMode()) {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === body.contractId);
    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (
      contract.client_id !== user.id &&
      contract.freelancer_id !== user.id &&
      user.profile.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let text = body.body.trim();
    let redacted = false;
    if (shouldApplyRedaction(contract.escrow_status)) {
      const result = redactContactInfo(text);
      text = result.text;
      redacted = result.redacted;
    }

    const message: Message = {
      id: randomUUID(),
      contract_id: body.contractId,
      sender_id: user.id,
      body: text,
      created_at: new Date().toISOString(),
    };
    store.messages.push(message);
    writeStore(store);
    return NextResponse.json({ message, redacted });
  }

  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("escrow_status, client_id, freelancer_id")
    .eq("id", body.contractId)
    .single();
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    contract.client_id !== user.id &&
    contract.freelancer_id !== user.id &&
    user.profile.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let text = body.body.trim();
  let redacted = false;
  if (shouldApplyRedaction(contract.escrow_status)) {
    const result = redactContactInfo(text);
    text = result.text;
    redacted = result.redacted;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      contract_id: body.contractId,
      sender_id: user.id,
      body: text,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data, redacted });
}
