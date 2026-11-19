"use client";

import { useState } from "react";
import { ShieldAlert, AlertTriangle, Scale, FileText, Link as LinkIcon } from "lucide-react";
import { DISPUTE_CATEGORIES, type DisputeCategory } from "@/lib/types";
import { useLanguage } from "@/components/LanguageProvider";

interface Props {
  busy: boolean;
  onRaiseDispute: (data: {
    category: DisputeCategory;
    reason: string;
    evidence_url?: string;
    evidence_notes?: string;
  }) => Promise<void>;
}

export function DisputeBox({ busy, onRaiseDispute }: Props) {
  const { language } = useLanguage();
  const [category, setCategory] = useState<DisputeCategory>("quality_mismatch");
  const [reason, setReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");

  const selectedCategory = DISPUTE_CATEGORIES[category];

  return (
    <div className="border-t border-slate-200 pt-5">
      <details className="text-xs text-slate-500 group">
        <summary className="cursor-pointer font-bold text-slate-700 hover:text-rose-700 transition flex items-center gap-2 select-none">
          <Scale className="h-4 w-4 text-rose-500" />
          <span>Need Neutral Platform Arbitration? (Open Dispute Case)</span>
        </summary>

        <div className="mt-4 space-y-4 rounded-2xl bg-rose-50/40 p-5 sm:p-6 border border-rose-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Arbitration 2.0 &amp; Escrow Freeze
              </h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Opening a dispute freezes funds in the Muday Vault. An independent platform arbiter
                will review the project brief, milestone worklogs, chat history, and deliverables to
                reach a fair release, refund, or partial split settlement.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-800 block">
                Dispute Category &amp; Violation Reason *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DisputeCategory)}
                className="input-field !py-2 text-xs w-full mt-1.5 bg-white font-medium"
              >
                {(Object.keys(DISPUTE_CATEGORIES) as DisputeCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {language === "am" ? DISPUTE_CATEGORIES[cat].amharic : DISPUTE_CATEGORIES[cat].label}
                  </option>
                ))}
              </select>
              {selectedCategory && (
                <p className="mt-1 text-[11px] text-slate-500 italic">
                  {selectedCategory.description}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block">
                Statement of Complaint &amp; Unresolved Issues *
              </label>
              <textarea
                rows={3}
                required
                className="input-field text-xs w-full mt-1.5"
                placeholder="Explain the breakdown in expectations, missed criteria, or unresponsiveness..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <LinkIcon className="h-3 w-3 text-slate-400" />
                  <span>Evidence URL (Optional)</span>
                </label>
                <input
                  type="url"
                  className="input-field !py-2 text-xs w-full mt-1.5"
                  placeholder="https://..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-slate-400" />
                  <span>Evidence Notes</span>
                </label>
                <input
                  type="text"
                  className="input-field !py-2 text-xs w-full mt-1.5"
                  placeholder="e.g. Commit sha abc1234, Figma slide 4"
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={busy || !reason.trim()}
                className="btn-danger !text-xs !py-2.5 !px-5 font-bold shadow-md inline-flex items-center gap-2"
                onClick={() =>
                  onRaiseDispute({
                    category,
                    reason: reason.trim(),
                    evidence_url: evidenceUrl.trim() || undefined,
                    evidence_notes: evidenceNotes.trim() || undefined,
                  })
                }
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Freeze Escrow &amp; Submit to Arbiter</span>
              </button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
