"use client";

import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { STEPPER_STEPS, stepperIndex } from "@/lib/escrow/state-machine";
import type { EscrowStatus } from "@/lib/types";

interface Props {
  status: EscrowStatus;
  revisionRequested?: boolean;
  revisionNotes?: string | null;
}

export function EscrowStepper({ status, revisionRequested, revisionNotes }: Props) {
  const currentStep = stepperIndex(status);

  return (
    <div className="card-surface p-6 rounded-3xl border border-slate-200/90 bg-white shadow-sm">
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {STEPPER_STEPS.map((step, idx) => {
          const done = currentStep > idx || status === "completed";
          const active = currentStep === idx;

          return (
            <div
              key={step.key}
              className={`rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
                active
                  ? "border-brand bg-orange-50/60 shadow-sm ring-1 ring-brand/30"
                  : done
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50/50 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Step 0{idx + 1}
                </p>
                {done && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <p
                className={`mt-1 text-xs font-bold ${
                  active
                    ? "text-brand-dark"
                    : done
                    ? "text-emerald-900"
                    : "text-slate-600"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {status === "disputed" && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-400 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div>
            <span className="font-bold text-slate-900">Dispute Arbitration In Progress</span>
            <p className="mt-0.5">
              Funds are safely locked in escrow. An arbiter will review submissions and evidence to resolve this contract.
            </p>
          </div>
        </div>
      )}

      {status === "funded" && revisionRequested && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400 bg-amber-50 p-4 text-xs text-amber-900">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 animate-spin" />
          <div>
            <span className="font-bold text-slate-900">Client Requested Revision</span>
            <p className="mt-0.5 text-slate-700">
              {revisionNotes || "Please make the requested adjustments and resubmit the work."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
