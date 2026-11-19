import Link from "next/link";
import { ArrowRight, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { formatEtb, formatMemberSince, relativeTime } from "@/lib/utils";
import type { Job } from "@/lib/types";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <article className="card-surface group rounded-3xl border border-slate-200/90 bg-white p-6 transition-all duration-300 hover:border-brand/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 transition group-hover:text-brand">
          <Link href={`/jobs/${job.id}`}>{job.title}</Link>
        </h3>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>MudayHub Escrow</span>
        </span>
      </div>

      <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
        {job.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          {job.category}
        </span>
        {(job.skills || []).slice(0, 4).map((s) => (
          <span
            key={s}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-lg font-extrabold text-slate-900 font-mono">{formatEtb(job.budget_etb)}</p>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{relativeTime(job.created_at)}</span>
            {job.profiles?.full_name && (
              <>
                <span className="text-slate-300">&middot;</span>
                <span className="font-semibold text-slate-700 truncate max-w-[120px]">{job.profiles.full_name}</span>
                {job.profiles.created_at && (
                  <span className="text-slate-400 font-normal">({formatMemberSince(job.profiles.created_at)})</span>
                )}
              </>
            )}
            {job.profiles?.is_verified && (
              <span className="inline-flex items-center text-emerald-600" title="Verified Client">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className="btn-primary !py-2 !px-4 !text-xs font-bold inline-flex items-center gap-1.5"
        >
          <span>View Project</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
