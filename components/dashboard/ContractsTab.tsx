"use client";

import Link from "next/link";
import { formatEtb } from "@/lib/utils";
import type { Contract } from "@/lib/types";

interface Props {
  contracts: Contract[];
}

export function ContractsTab({ contracts }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            All Escrow Contracts ({contracts.length})
          </h2>
          <p className="text-xs text-slate-500">
            Manage active milestones, deliverable submissions, and fund releases.
          </p>
        </div>
        <Link href="/contracts" className="btn-secondary !text-xs !py-2 !px-4 font-bold">
          Full Contracts Workspace →
        </Link>
      </div>

      {contracts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-xs text-slate-600 border border-slate-200">
          No contracts found.
        </div>
      ) : (
        <div className="glass-card divide-y divide-slate-100 rounded-2xl overflow-hidden border border-slate-200">
          {contracts.map((c) => {
            const contractTitle = c.gigs?.title || c.jobs?.title || "Contract Engagement";
            return (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="badge-c2sa">
                      {c.package_tier ? `${c.package_tier} Service` : "Project Escrow"}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{contractTitle}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Ref:{" "}
                    <code className="text-slate-800 font-mono">
                      {c.payment_reference || c.id.slice(0, 8)}
                    </code>{" "}
                    · Status:{" "}
                    <span className="font-semibold text-emerald-700 capitalize">
                      {c.escrow_status.replace(/_/g, " ")}
                    </span>{" "}
                    · Amount:{" "}
                    <strong className="text-slate-900 font-mono">
                      {formatEtb(c.total_amount_etb)}
                    </strong>
                  </p>
                </div>
                <Link
                  href={`/contracts/${c.id}`}
                  className="btn-c2sa !py-2 !px-4 !text-xs font-bold whitespace-nowrap text-center"
                >
                  Open Escrow Room
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
