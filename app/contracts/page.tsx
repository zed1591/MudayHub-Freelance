"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  DollarSign
} from "lucide-react";
import { contractsApi } from "@/lib/api";
import { useSession } from "@/components/SessionProvider";
import { formatEtb } from "@/lib/utils";
import type { Contract } from "@/lib/types";

export default function ContractsPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    contractsApi.mine().then((d) => setContracts(d.contracts || [])).catch(() => undefined);
  }, [user, loading, router]);

  const filteredContracts = contracts.filter((c) => {
    if (filter === "active") {
      return ["awaiting_deposit", "funded", "work_submitted", "disputed"].includes(c.escrow_status);
    }
    if (filter === "completed") {
      return ["completed", "refunded"].includes(c.escrow_status);
    }
    return true;
  });

  const totalVolume = contracts.reduce((acc, c) => acc + (c.total_amount_etb || 0), 0);
  const activeCount = contracts.filter((c) => 
    ["awaiting_deposit", "funded", "work_submitted", "disputed"].includes(c.escrow_status)
  ).length;
  const completedCount = contracts.filter((c) => c.escrow_status === "completed").length;

  return (
    <div className="mx-auto w-full max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-8 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Escrow Workspace</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            My Contracts &amp; Workspace
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed">
            Track project agreements, review submitted work, and manage escrow disbursements.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/jobs/new"
            className="btn-secondary !py-2.5 !px-4 text-xs font-semibold"
          >
            Post Request
          </Link>
          <Link
            href="/gigs"
            className="btn-c2sa !py-2.5 !px-5 text-xs font-bold"
          >
            Explore Services
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="mt-8 grid grid-cols-1 divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="py-4 sm:px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Contract Value</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">{formatEtb(totalVolume)}</p>
          <p className="mt-1 text-[11px] text-slate-500">Across {contracts.length} agreements</p>
        </div>

        <div className="py-4 sm:px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Escrow Engagements</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-brand-dark font-mono">{activeCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">In production or pending review</p>
        </div>

        <div className="py-4 sm:px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed &amp; Released</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700 font-mono">{completedCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">Successfully closed contracts</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all" as const, label: "All Contracts", count: contracts.length },
            { id: "active" as const, label: "Active Escrow", count: activeCount },
            { id: "completed" as const, label: "Settled & Released", count: completedCount },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  isActive
                    ? "bg-brand text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Showing {filteredContracts.length} of {contracts.length} records
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {filteredContracts.length === 0 ? (
          <div className="card-surface rounded-3xl p-12 text-center border border-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Package className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">No contracts found</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              {filter !== "all" 
                ? "No contracts match the selected status filter." 
                : "You don't have any contracts yet. Hire a specialist on a custom project or order a ready service package to begin."}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/gigs" className="btn-primary !text-xs !py-2.5 !px-5 font-bold shadow-ochre">
                Browse Ready Services
              </Link>
              <Link href="/jobs" className="btn-secondary !text-xs !py-2.5 !px-5 font-semibold">
                View Projects
              </Link>
            </div>
          </div>
        ) : (
          filteredContracts.map((c) => {
            const isClient = user?.id === c.client_id;
            const title = (c as Contract & { jobs?: { title: string } }).jobs?.title ||
              (c.package_tier ? `Service Package (${c.package_tier.toUpperCase()})` : `Milestone Contract #${c.id.slice(0, 8)}`);

            const statusColors: Record<string, string> = {
              awaiting_deposit: "border-slate-300 bg-slate-100 text-slate-700",
              funded: "border-brand/30 bg-amber-50 text-brand-dark",
              work_submitted: "border-amber-300 bg-amber-50 text-amber-800",
              completed: "border-emerald-300 bg-emerald-50 text-emerald-800",
              refunded: "border-rose-300 bg-rose-50 text-rose-700",
              disputed: "border-rose-300 bg-rose-50 text-rose-700",
            };

            return (
              <Link
                key={c.id}
                href={`/contracts/${c.id}`}
                className="card-surface group flex flex-col justify-between gap-4 rounded-3xl p-6 transition-all duration-200 hover:border-brand/40 hover:shadow-sm sm:flex-row sm:items-center border border-slate-200/90"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                        statusColors[c.escrow_status] || "border-slate-300 bg-slate-100 text-slate-700"
                      }`}
                    >
                      {c.escrow_status.replace(/_/g, " ")}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                      Role: {isClient ? "Client (Buyer)" : "Specialist (Seller)"}
                    </span>
                    {c.package_tier && (
                      <span className="badge-brand">
                        {c.package_tier} Tier
                      </span>
                    )}
                    {c.revision_requested && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <AlertTriangle className="h-3 w-3" />
                        Revision in Progress
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 transition group-hover:text-brand-dark">
                    {title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-mono">ID: {c.id.slice(0, 8)}...</span>
                    <span>&bull;</span>
                    <span>Created {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Escrow Amount
                    </p>
                    <p className="text-xl font-extrabold text-slate-900 font-mono">
                      {formatEtb(c.total_amount_etb)}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
