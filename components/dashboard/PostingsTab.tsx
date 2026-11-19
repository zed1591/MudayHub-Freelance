"use client";

import Link from "next/link";
import Image from "next/image";
import { formatEtb } from "@/lib/utils";
import type { Gig, Job } from "@/lib/types";

interface Props {
  isClient: boolean;
  myJobs: Job[];
  myGigs: Gig[];
}

export function PostingsTab({ isClient, myJobs, myGigs }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isClient
              ? `My Project Requests (${myJobs.length})`
              : `My Published Services (${myGigs.length})`}
          </h2>
          <p className="text-xs text-slate-500">
            {isClient
              ? "Custom project briefs posted to the marketplace."
              : "Fixed-price service packages offered in the catalog."}
          </p>
        </div>
        {isClient ? (
          <Link
            href="/jobs/new"
            className="btn-c2sa !text-xs !py-2 !px-4 font-bold"
          >
            + Post New RFP
          </Link>
        ) : (
          <Link
            href="/gigs/new"
            className="btn-c2sa !text-xs !py-2 !px-4 font-bold"
          >
            + Add New Service
          </Link>
        )}
      </div>

      {isClient ? (
        myJobs.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-xs text-slate-600 border border-slate-200">
            No project requests posted yet.
          </div>
        ) : (
          <div className="glass-card divide-y divide-slate-100 rounded-2xl overflow-hidden border border-slate-200">
            {myJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="badge-c2sa">{job.status}</span>
                    <span className="text-sm font-bold text-slate-900">{job.title}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Budget:{" "}
                    <strong className="text-slate-900 font-mono">
                      {formatEtb(job.budget_etb)}
                    </strong>{" "}
                    · Category: {job.category}
                  </p>
                </div>
                <Link
                  href={`/jobs/${job.id}`}
                  className="btn-secondary !py-2 !px-4 !text-xs font-bold whitespace-nowrap text-center hover:border-c2sa-crimson hover:text-c2sa-crimson transition"
                >
                  View Applicants
                </Link>
              </div>
            ))}
          </div>
        )
      ) : myGigs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-xs text-slate-600 border border-slate-200">
          No service offerings published yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myGigs.map((g) => (
            <div
              key={g.id}
              className="glass-card rounded-2xl p-4 space-y-3 hover:border-c2sa-crimson/50 transition border border-slate-200"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                <Image
                  src={
                    g.cover_image ||
                    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80"
                  }
                  alt={g.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                />
              </div>
              <h3 className="line-clamp-2 text-xs font-bold text-slate-900">{g.title}</h3>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-600">{g.category}</span>
                <span className="font-bold text-c2sa-crimson font-mono">
                  From {formatEtb(g.packages.basic.price_etb)}
                </span>
              </div>
              <Link
                href={`/gigs/${g.id}`}
                className="btn-secondary w-full !text-xs !py-1.5 text-center block font-bold hover:border-c2sa-crimson hover:text-c2sa-crimson transition"
              >
                View Live Offering
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
