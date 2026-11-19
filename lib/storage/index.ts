import fs from "fs";
import path from "path";
import crypto from "crypto";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore, writeStore } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StoredUpload } from "@/lib/types";

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_EXTENSIONS = new Set([
  // Documents & spreadsheets
  "pdf", "doc", "docx", "xls", "xlsx", "txt", "md", "csv", "rtf",
  // Compressed archives
  "zip", "tar", "gz", "tgz", "7z", "rar",
  // Images
  "png", "jpg", "jpeg", "webp", "svg", "gif",
  // Audio & video deliverables
  "mp4", "mov", "webm", "mp3", "wav",
  // Design & source assets
  "fig", "sketch", "xd", "psd", "ai", "json",
]);

export const FORBIDDEN_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "bash", "php", "phtml", "js", "ts",
  "jsx", "tsx", "html", "htm", "vbs", "py", "rb", "pl", "jar",
  "apk", "bin", "msi", "dll", "com", "scr", "c", "cpp", "go",
]);

const UPLOADS_DIR = path.join(process.cwd(), ".demo-data", "uploads");

export interface ValidateFileResult {
  valid: boolean;
  error?: string;
  sanitizedFilename: string;
  extension: string;
}

export function validateUploadedFile(originalName: string, size: number): ValidateFileResult {
  if (!originalName || typeof originalName !== "string") {
    return { valid: false, error: "Missing filename", sanitizedFilename: "", extension: "" };
  }

  if (size <= 0) {
    return { valid: false, error: "File is empty", sanitizedFilename: "", extension: "" };
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum allowed size of 25MB (${(size / (1024 * 1024)).toFixed(1)}MB)`,
      sanitizedFilename: "",
      extension: "",
    };
  }

  // Prevent path traversal and control characters
  const cleanBase = path.basename(originalName).replace(/[\0\r\n\t]/g, "").trim();
  const lastDot = cleanBase.lastIndexOf(".");
  if (lastDot <= 0) {
    return {
      valid: false,
      error: "Files must have a valid file extension",
      sanitizedFilename: "",
      extension: "",
    };
  }

  const extension = cleanBase.slice(lastDot + 1).toLowerCase();
  if (FORBIDDEN_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      error: `Executable and script files (.${extension}) are strictly prohibited`,
      sanitizedFilename: "",
      extension,
    };
  }

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      error: `File type .${extension} is not supported. Please upload a standard document, archive, or media file.`,
      sanitizedFilename: "",
      extension,
    };
  }

  // Sanitize filename base to avoid shell or browser escaping issues
  const rawStem = cleanBase.slice(0, lastDot).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const sanitizedFilename = `${rawStem || "file"}.${extension}`;

  return {
    valid: true,
    sanitizedFilename,
    extension,
  };
}

export async function saveFileDeliverable({
  contractId,
  uploaderId,
  file,
  purpose = "deliverable",
}: {
  contractId: string;
  uploaderId: string;
  file: File;
  purpose?: "deliverable" | "dispute_evidence" | "general";
}): Promise<StoredUpload> {
  const validation = validateUploadedFile(file.name, file.size);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileId = crypto.randomUUID();
  const storagePath = `${contractId}/${fileId}-${validation.sanitizedFilename}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";

  const uploadRecord: StoredUpload = {
    id: fileId,
    contract_id: contractId,
    original_name: validation.sanitizedFilename,
    storage_path: storagePath,
    size_bytes: file.size,
    mime_type: mimeType,
    uploader_id: uploaderId,
    purpose,
    created_at: new Date().toISOString(),
  };

  if (isDemoMode()) {
    const targetPath = path.join(UPLOADS_DIR, storagePath);
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, buffer);

    const store = readStore();
    store.uploads = store.uploads || [];
    store.uploads.push(uploadRecord);
    writeStore(store);

    return uploadRecord;
  }

  // Supabase Storage
  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("contract-files")
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload deliverable: ${uploadError.message}`);
  }

  // Save metadata to Supabase DB table if exists
  try {
    await admin.from("contract_uploads").insert({
      id: uploadRecord.id,
      contract_id: uploadRecord.contract_id,
      original_name: uploadRecord.original_name,
      storage_path: uploadRecord.storage_path,
      size_bytes: uploadRecord.size_bytes,
      mime_type: uploadRecord.mime_type,
      uploader_id: uploadRecord.uploader_id,
      purpose: uploadRecord.purpose,
      created_at: uploadRecord.created_at,
    });
  } catch {
    // If contract_uploads table hasn't been migrated yet, storagePath still remains resolvable
  }

  return uploadRecord;
}

export async function getFileDownloadUrlOrBuffer({
  fileId,
}: {
  fileId: string;
}): Promise<
  | { type: "redirect"; url: string; filename: string }
  | { type: "buffer"; buffer: Buffer; filename: string; mimeType: string }
  | null
> {
  if (isDemoMode()) {
    const store = readStore();
    const upload = (store.uploads || []).find((u) => u.id === fileId);
    if (!upload) return null;

    const targetPath = path.join(UPLOADS_DIR, upload.storage_path);
    if (!fs.existsSync(targetPath)) return null;

    const buffer = await fs.promises.readFile(targetPath);
    return {
      type: "buffer",
      buffer,
      filename: upload.original_name,
      mimeType: upload.mime_type,
    };
  }

  const admin = createAdminClient();
  const { data: record } = await admin
    .from("contract_uploads")
    .select("*")
    .eq("id", fileId)
    .single();

  if (!record) return null;

  const { data: signedData, error } = await admin.storage
    .from("contract-files")
    .createSignedUrl(record.storage_path, 3600, {
      download: record.original_name,
    });

  if (error || !signedData?.signedUrl) {
    return null;
  }

  return {
    type: "redirect",
    url: signedData.signedUrl,
    filename: record.original_name,
  };
}
