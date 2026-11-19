import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Clock, ShieldCheck, Star } from "lucide-react";
import { formatEtb } from "@/lib/utils";
import type { Gig } from "@/lib/types";

interface Props {
  gig: Gig;
}

export function GigCard({ gig }: Props) {
  const basicPkg = gig.packages?.basic;
  const startingPrice = basicPkg ? basicPkg.price_etb : 0;
  const deliveryDays = basicPkg ? basicPkg.delivery_days : 3;

  return (
    <Link
      href={`/gigs/${gig.id}`}
      className="group card-surface flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-md"
    >
      {/* Cover image banner */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <Image
          src={
            gig.cover_image ||
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80"
          }
          alt={gig.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-xl border border-white/40 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-900 backdrop-blur-md shadow-sm">
          {gig.category}
        </span>
        <span className="absolute top-3 right-3 rounded-xl border border-rose-600/30 bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-[#C8102E] backdrop-blur-md flex items-center gap-1 shadow-sm">
          <ShieldCheck className="h-3 w-3 text-[#C8102E]" />
          <span>C²SA Escrow</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Freelancer profile */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#C8102E] to-[#BD5D38] text-xs font-bold text-white shadow-sm ring-1 ring-white/20">
            {gig.freelancer?.full_name?.charAt(0) || "F"}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-xs font-semibold text-slate-700 group-hover:text-[#C8102E] transition">
              {gig.freelancer?.full_name || "Marketplace professional"}
            </span>
            {gig.freelancer?.is_verified && (
              <span title="C²SA Vetted Specialist">
                <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              </span>
            )}
          </div>
        </div>

        {/* Gig Title */}
        <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition group-hover:text-[#C8102E]">
          {gig.title}
        </h3>

        {/* Rating and delivery */}
        <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-bold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
            <span className="text-slate-900 font-mono">
              {gig.rating ? Number(gig.rating).toFixed(1) : "5.0"}
            </span>
            <span className="text-slate-500 font-normal">({gig.reviews_count || 0})</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{deliveryDays}d delivery</span>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {(gig.tags || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer starting price */}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Starting Package
          </span>
          <span className="text-base font-extrabold text-slate-900 font-mono transition group-hover:text-brand">
            {formatEtb(startingPrice)}
          </span>
        </div>
      </div>
    </Link>
  );
}
