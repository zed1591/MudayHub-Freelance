"use client";

import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { formatEtb } from "@/lib/utils";
import type { Milestone, UserRole } from "@/lib/types";

interface Props {
  milestones: Milestone[];
  role: UserRole;
  busy: boolean;
  onReleaseMilestone?: (milestoneId: string) => void;
}

export function MilestonesTable({
  milestones,
  role,
  busy,
  onReleaseMilestone,
}: Props) {
  if (!milestones || milestones.length === 0) return null;

  const isClient = role === "client";

  return (
    <div className="card-surface p-6 rounded-3xl border border-slate-200/90 bg-white shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand" />
          <h3 className="text-sm font-bold text-slate-900">
            Project Milestones ({milestones.length})
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Sequential Deliverable Releases
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {milestones.map((m) => {
          const isDone = m.status === "completed";
          const isSubmitted = m.status === "work_submitted";
          const isLocked = m.status === "locked";

          return (
            <div
              key={m.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                    {m.ordinal}
                  </span>
                  <span className="font-bold text-slate-900">{m.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      isDone
                        ? "bg-emerald-100 text-emerald-800"
                        : isSubmitted
                        ? "bg-amber-100 text-amber-900"
                        : isLocked
                        ? "bg-slate-100 text-slate-600"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {m.status.replace(/_/g, " ")}
                  </span>
                </div>
                {m.description && (
                  <p className="text-[11px] text-slate-600 ml-7">{m.description}</p>
                )}
              </div>

              <div className="flex items-center gap-4 ml-7 sm:ml-0">
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">
                    {formatEtb(m.amount_etb)}
                  </span>
                  {m.due_days && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {m.due_days} days
                    </span>
                  )}
                </div>

                {isClient && isSubmitted && onReleaseMilestone && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onReleaseMilestone(m.id)}
                    className="btn-escrow !py-1 !px-3 !text-[11px] font-bold shrink-0"
                  >
                    Release {formatEtb(Math.round(m.amount_etb * 0.93 * 100) / 100)}
                  </button>
                )}

                {isDone && (
                  <span className="text-emerald-700 font-bold inline-flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="h-4 w-4" /> Settled
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
