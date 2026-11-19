import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getFileDownloadUrlOrBuffer } from "@/lib/storage";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSecurityEvent } from "@/lib/security/audit";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "fileId query parameter is required" }, { status: 400 });
  }

  // Double-gated Authorization: Look up upload record to check contract participation
  let contractId: string | null = null;
  if (isDemoMode()) {
    const store = readStore();
    const upload = (store.uploads || []).find((u) => u.id === fileId);
    if (!upload) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    contractId = upload.contract_id;
  } else {
    const admin = createAdminClient();
    const { data: record } = await admin
      .from("contract_uploads")
      .select("contract_id")
      .eq("id", fileId)
      .single();

    if (!record) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    contractId = record.contract_id;
  }

  // Verify participant permissions
  let isParticipant = false;
  if (isDemoMode()) {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === contractId);
    if (contract) {
      isParticipant =
        contract.client_id === user.id ||
        contract.freelancer_id === user.id ||
        user.profile.role === "admin";
    }
  } else {
    const admin = createAdminClient();
    const { data: contract } = await admin
      .from("contracts")
      .select("client_id, freelancer_id")
      .eq("id", contractId)
      .single();

    if (contract) {
      isParticipant =
        contract.client_id === user.id ||
        contract.freelancer_id === user.id ||
        user.profile.role === "admin";
    }
  }

  if (!isParticipant) {
    await recordSecurityEvent({
      actorId: user.id,
      eventType: "storage.download.forbidden_attempt",
      metadata: { fileId, contractId },
    });
    return NextResponse.json(
      { error: "Forbidden: You are not a participant in this contract" },
      { status: 403 }
    );
  }

  const fileData = await getFileDownloadUrlOrBuffer({ fileId });
  if (!fileData) {
    return NextResponse.json({ error: "File could not be retrieved" }, { status: 404 });
  }

  await recordSecurityEvent({
    actorId: user.id,
    eventType: "storage.file_downloaded",
    metadata: { fileId, contractId, filename: fileData.filename },
  });

  if (fileData.type === "redirect") {
    return NextResponse.redirect(fileData.url);
  }

  const response = new NextResponse(new Uint8Array(fileData.buffer), {
    status: 200,
    headers: {
      "Content-Type": fileData.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileData.filename)}"`,
      "Content-Length": String(fileData.buffer.length),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });

  return response;
}
