import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { saveFileDeliverable, MAX_FILE_SIZE_BYTES } from "@/lib/storage";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSecurityEvent } from "@/lib/security/audit";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const contractId = formData.get("contractId");
  const purpose = (formData.get("purpose") as string) || "deliverable";

  if (!contractId || typeof contractId !== "string") {
    return NextResponse.json({ error: "contractId is required" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A valid file is required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 413 });
  }

  // IDOR & Authorization Defense: Verify user is a contract participant or admin
  let isParticipant = false;
  if (isDemoMode()) {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === contractId);
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    isParticipant =
      contract.client_id === user.id ||
      contract.freelancer_id === user.id ||
      user.profile.role === "admin";
  } else {
    const admin = createAdminClient();
    const { data: contract } = await admin
      .from("contracts")
      .select("id, client_id, freelancer_id")
      .eq("id", contractId)
      .single();

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    isParticipant =
      contract.client_id === user.id ||
      contract.freelancer_id === user.id ||
      user.profile.role === "admin";
  }

  if (!isParticipant) {
    await recordSecurityEvent({
      actorId: user.id,
      eventType: "storage.upload.forbidden_attempt",
      metadata: { contractId, filename: file.name },
    });
    return NextResponse.json({ error: "Forbidden: Not a participant in this contract" }, { status: 403 });
  }

  try {
    const upload = await saveFileDeliverable({
      contractId,
      uploaderId: user.id,
      file,
      purpose: purpose === "dispute_evidence" ? "dispute_evidence" : "deliverable",
    });

    await recordSecurityEvent({
      actorId: user.id,
      eventType: "storage.file_uploaded",
      metadata: {
        contractId,
        fileId: upload.id,
        filename: upload.original_name,
        sizeBytes: upload.size_bytes,
        purpose,
      },
    });

    const downloadUrl = `/api/storage/download?fileId=${upload.id}`;

    return NextResponse.json({
      success: true,
      upload: {
        id: upload.id,
        filename: upload.original_name,
        sizeBytes: upload.size_bytes,
        mimeType: upload.mime_type,
        url: downloadUrl,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 }
    );
  }
}
