"use client";

import { useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";

interface Props {
  contractId: string;
  busy: boolean;
  onSubmit: (submissionUrl: string) => Promise<void>;
}

export function DeliverableSubmissionBox({ contractId, busy, onSubmit }: Props) {
  const [submissionTab, setSubmissionTab] = useState<"link" | "file">("link");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    id: string;
    filename: string;
    sizeBytes: number;
  } | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contractId", contractId);
    formData.append("purpose", "deliverable");

    try {
      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploading(false);

      if (res.ok && data.upload) {
        setUploadedFile({
          id: data.upload.id,
          filename: data.upload.original_name,
          sizeBytes: data.upload.size_bytes,
        });
        setUrl(`/api/storage/download?fileId=${data.upload.id}`);
      }
    } catch {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-bold text-slate-900">Submit Completed Deliverable</h3>
        <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 text-xs">
          <button
            type="button"
            className={`px-3 py-1 rounded-lg font-medium transition ${
              submissionTab === "link"
                ? "bg-brand text-white font-semibold shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setSubmissionTab("link")}
          >
            External Link
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-lg font-medium transition ${
              submissionTab === "file"
                ? "bg-brand text-white font-semibold shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setSubmissionTab("file")}
          >
            Upload File
          </button>
        </div>
      </div>

      {submissionTab === "link" ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-600">
            Provide GitHub repository, Figma prototype link, Google Drive folder, or production deployment URL.
          </p>
          <input
            className="input-field text-xs"
            placeholder="https://github.com/... or staging deployment URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Upload completed code archive, PDF document, design asset, or media deliverables (up to 25MB).
          </p>
          <div className="flex items-center gap-3">
            <label className="btn-secondary !text-xs cursor-pointer inline-flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>{uploading ? "Uploading…" : "Choose File (ZIP, PDF, Assets)"}</span>
              <input
                type="file"
                className="hidden"
                disabled={uploading || busy}
                onChange={handleFileUpload}
                accept=".zip,.pdf,.tar.gz,.png,.jpg,.jpeg,.doc,.docx,.txt,.csv,.mp4"
              />
            </label>
            {uploadedFile && (
              <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {uploadedFile.filename} ({(uploadedFile.sizeBytes / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={busy || !url || uploading}
        className="btn-primary !text-xs font-bold shadow-ochre"
        onClick={() => onSubmit(url)}
      >
        {busy ? "Submitting…" : "Submit Deliverable for Client Inspection"}
      </button>
    </div>
  );
}
