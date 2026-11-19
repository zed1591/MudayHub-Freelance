"use client";

import Link from "next/link";
import { formatEtb } from "@/lib/utils";
import type { Proposal } from "@/lib/types";

interface Props {
  isClient: boolean;
  proposals: Proposal[];
}

export function ProposalsTab({ isClient, proposals }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isClient
              ? `Applicant Proposals (${proposals.length})`
              : `My Submitted Bids (${proposals.length})`}
          </h2>
          <p className="text-xs text-slate-500">
            {isClient
              ? "Review applicant proposals and award contracts."
              : "Track status of bids placed on client briefs."}
          </p>
        </div>
        <Link
          href="/proposals"
          className="btn-secondary !text-xs !py-2 !px-4 font-bold shrink-0"
        >
          Open Submitted Bids Console →
        </Link>
      </div>

      {proposals.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-xs text-slate-600 border border-slate-200">
          No proposals found.
        </div>
      ) : (
        <div className="glass-card divide-y divide-slate-100 rounded-2xl overflow-hidden border border-slate-200">
          {proposals.map((p) => {
            const freelancerName = p.profiles?.full_name || "Specialist";
            const jobTitle = p.jobs?.title || "Custom Project";

            return (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {isClient ? `${freelancerName} applied for "${jobTitle}"` : jobTitle}
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    Proposed:{" "}
                    <span className="font-bold text-c2sa-crimson font-mono">
                      {formatEtb(p.bid_amount_etb)}
                    </span>{" "}
                    · Duration: {p.duration_days} days · Status:{" "}
                    <span className="capitalize text-slate-900 font-semibold">
                      {p.status}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/jobs/${p.job_id}`}
                  className="btn-secondary !py-1.5 !px-3.5 !text-xs whitespace-nowrap font-bold hover:border-c2sa-crimson hover:text-c2sa-crimson transition"
                >
                  {isClient ? "Review & Hire" : "View Project"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
