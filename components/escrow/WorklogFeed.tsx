"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  FileCode,
  Copy,
  Check,
  Layers,
} from "lucide-react";
import type { Milestone, UserRole, WorklogEntry } from "@/lib/types";

interface Props {
  contractId: string;
  role: UserRole;
  milestones?: Milestone[];
  isLocked?: boolean;
}

export function WorklogFeed({ contractId, role, milestones, isLocked }: Props) {
  const [worklogs, setWorklogs] = useState<WorklogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hoursSpent, setHoursSpent] = useState("");
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyUrl(id: string, url: string) {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  const isFreelancer = role === "freelancer";
  const isClient = role === "client";

  function loadWorklogs() {
    setLoading(true);
    fetch(`/api/contracts/${contractId}/worklogs`)
      .then((r) => r.json())
      .then((d) => {
        if (d.worklogs) setWorklogs(d.worklogs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadWorklogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  async function handleAddWorklog(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/contracts/${contractId}/worklogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          title: title.trim(),
          description: description.trim(),
          hours_spent: hoursSpent ? Number(hoursSpent) : undefined,
          deliverable_url: deliverableUrl.trim() || undefined,
          milestoneId: milestoneId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add worklog");
      } else {
        setTitle("");
        setDescription("");
        setHoursSpent("");
        setDeliverableUrl("");
        setMilestoneId("");
        setShowAddForm(false);
        loadWorklogs();
      }
    } catch {
      setError("Network error while submitting worklog");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(worklogId: string, status: "approved" | "needs_revision") {
    try {
      const res = await fetch(`/api/contracts/${contractId}/worklogs/${worklogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          feedback: feedback.trim() || undefined,
        }),
      });

      if (res.ok) {
        setReviewingId(null);
        setFeedback("");
        loadWorklogs();
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand" />
            <h3 className="text-base font-bold text-slate-900">Worklog &amp; Progress Timeline</h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Audit trail of milestone progress updates, commit links, and client review checkpoints.
          </p>
        </div>

        {isFreelancer && !isLocked && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary !text-xs !py-2 !px-4 inline-flex items-center gap-1.5 shadow-ochre"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showAddForm ? "Cancel" : "Log Progress"}</span>
          </button>
        )}
      </div>

      {/* Add Progress Update Form */}
      {showAddForm && (
        <form onSubmit={handleAddWorklog} className="rounded-xl border border-brand/20 bg-orange-50/40 p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-900">Add Milestone Progress Checkpoint</h4>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700">Update Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Completed initial frontend dashboard"
                className="input-field !py-2 text-xs w-full mt-1"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700">Associated Milestone</label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="input-field !py-2 text-xs w-full mt-1 bg-white"
              >
                <option value="">General Project Progress</option>
                {milestones?.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.ordinal} {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700">Description of Work *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail what tasks were completed, architecture decisions, and test results..."
              className="input-field text-xs w-full mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700">Deliverable Link (Figma, GitHub, Staging)</label>
              <input
                type="url"
                value={deliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="input-field !py-2 text-xs w-full mt-1"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700">Hours Invested (Optional)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={hoursSpent}
                onChange={(e) => setHoursSpent(e.target.value)}
                placeholder="e.g. 6.5"
                className="input-field !py-2 text-xs w-full mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary !text-xs !py-1.5 !px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="btn-primary !text-xs !py-1.5 !px-4 shadow-ochre font-bold"
            >
              {submitting ? "Posting..." : "Submit Progress Update"}
            </button>
          </div>
        </form>
      )}

      {/* Progress Timeline Feed */}
      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading progress updates...</div>
      ) : worklogs.length === 0 ? (
        <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6">
          <Clock className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-xs font-semibold text-slate-600">No worklog entries yet</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {isFreelancer
              ? "Post regular progress checkpoints to give your client confidence and establish an evidence audit trail."
              : "The specialist has not logged any intermediate milestone progress updates yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {worklogs.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 transition hover:border-slate-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{entry.title}</span>
                  {entry.milestone_id && milestones && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand/10 border border-brand/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-dark">
                      <Layers className="h-3 w-3" />
                      <span>
                        Milestone #{milestones.find((m) => m.id === entry.milestone_id)?.ordinal || "1"}
                      </span>
                    </span>
                  )}
                  {entry.hours_spent ? (
                    <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-700">
                      {entry.hours_spent} hrs
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {entry.status === "approved" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Approved by Client</span>
                    </span>
                  ) : entry.status === "needs_revision" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                      <AlertCircle className="h-3 w-3" />
                      <span>Revision Requested</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Submitted for Review
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {new Date(entry.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {entry.description}
              </p>

              {entry.deliverable_url && (
                <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                    <FileCode className="h-3.5 w-3.5 text-brand shrink-0" />
                    <a
                      href={entry.deliverable_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-brand hover:underline truncate max-w-xs sm:max-w-md"
                    >
                      {entry.deliverable_url}
                    </a>
                    <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                  </div>
                  <button
                    type="button"
                    onClick={() => copyUrl(entry.id, entry.deliverable_url!)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1 transition"
                    title="Copy deliverable link"
                  >
                    {copiedId === entry.id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-slate-400" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {entry.feedback && (
                <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-600 flex items-start gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Client Feedback: </span>
                    <span>{entry.feedback}</span>
                  </div>
                </div>
              )}

              {/* Client Review Actions */}
              {isClient && entry.status === "submitted" && (
                <div className="pt-2 border-t border-slate-200/70">
                  {reviewingId === entry.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Optional feedback note..."
                        className="input-field !py-1.5 text-xs w-full"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleReview(entry.id, "approved")}
                          className="btn-escrow !text-[11px] !py-1 !px-3 font-bold"
                        >
                          Confirm Approval
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(entry.id, "needs_revision")}
                          className="btn-danger !text-[11px] !py-1 !px-3 font-bold"
                        >
                          Request Revision
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewingId(null)}
                          className="btn-secondary !text-[11px] !py-1 !px-2.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReview(entry.id, "approved")}
                        className="btn-escrow !text-[11px] !py-1 !px-3 font-bold inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Approve Work</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewingId(entry.id)}
                        className="btn-secondary !text-[11px] !py-1 !px-3"
                      >
                        Add Feedback
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
