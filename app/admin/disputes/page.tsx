"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Eye,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Scale,
  Percent,
  FileText,
  Sliders,
  Maximize2,
  Minimize2,
  Wallet,
  Activity,
} from "lucide-react";
import { formatEtb } from "@/lib/utils";
import { DISPUTE_CATEGORIES, type Contract, type Dispute, type Profile } from "@/lib/types";
import { authApi } from "@/lib/api";
import { useSession } from "@/components/SessionProvider";

type Row = Dispute & {
  contract?: Contract;
  raiser?: Profile;
};

export default function AdminDisputesPage() {
  const router = useRouter();
  const { refresh, demoMode } = useSession();
  const [disputes, setDisputes] = useState<Row[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [splitPcts, setSplitPcts] = useState<Record<string, number>>({});
  const [modes, setModes] = useState<Record<string, "release" | "refund" | "split">>({});
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "open" | "under_review" | "resolved">("all");
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(true);

  function load() {
    fetch("/api/admin/disputes")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setDisputes(d.disputes || []);
      })
      .catch(() => setError("Failed to load disputes"));
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.push("/login");
        else if (d.user.profile.role !== "admin") setError("Admin only");
        else load();
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function loginAsArbiter() {
    if (!demoMode) return;
    try {
      await authApi.login("admin@mudayhub.et", "demo1234");
      await refresh();
      setError("");
      load();
    } catch {
      // ignore
    }
  }

  async function resolve(disputeId: string, outcome: "release" | "refund" | "split") {
    setActionBusy((prev) => ({ ...prev, [disputeId]: true }));
    const splitPct = splitPcts[disputeId] || 50;

    const res = await fetch("/api/admin/disputes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        disputeId,
        status: "resolved",
        resolution_notes:
          notes[disputeId] ||
          (outcome === "split"
            ? `Muday-Freelance platform arbitration: ${splitPct}% / ${100 - splitPct}% split settlement`
            : `Muday-Freelance platform arbitration: ${outcome}`),
        outcome,
        split_pct: outcome === "split" ? splitPct : undefined,
      }),
    });
    const data = await res.json();
    setActionBusy((prev) => ({ ...prev, [disputeId]: false }));
    if (!res.ok) {
      setError(data.error || "Failed to resolve dispute");
      return;
    }
    load();
  }

  async function review(disputeId: string) {
    setActionBusy((prev) => ({ ...prev, [disputeId]: true }));
    await fetch("/api/admin/disputes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disputeId, status: "under_review" }),
    });
    setActionBusy((prev) => ({ ...prev, [disputeId]: false }));
    load();
  }

  if (error === "Admin only") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-300 bg-rose-50 text-rose-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Administrator Access Required</h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          {demoMode
            ? "You need an active platform arbiter account to access the Escrow Arbitration console. Click below for 1-click test access."
            : "This console is restricted to verified MudayHub platform arbiters. Please authenticate with your authorized administrator credentials."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {demoMode ? (
            <button
              onClick={loginAsArbiter}
              className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-ochre"
            >
              1-Click Sign In as Muday Arbiter
            </button>
          ) : (
            <Link href="/login" className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-ochre">
              Sign In with Admin Account
            </Link>
          )}
          <Link href="/" className="btn-secondary !py-2.5 !px-5 text-xs font-semibold">
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const openCount = disputes.filter((d) => d.status === "open").length;
  const underReviewCount = disputes.filter((d) => d.status === "under_review").length;
  const resolvedCount = disputes.filter((d) => d.status === "resolved").length;
  const totalContestedEtb = disputes.reduce((sum, d) => sum + Number(d.contract?.total_amount_etb || 0), 0);

  const filteredDisputes = disputes.filter((d) => {
    if (activeTab === "open") return d.status === "open";
    if (activeTab === "under_review") return d.status === "under_review";
    if (activeTab === "resolved") return d.status === "resolved";
    return true;
  });

  return (
    <div className={`transition-all duration-300 ${isFullscreen ? "w-full max-w-[1720px] mx-auto px-3 sm:px-6 py-6" : "mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"}`}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8102E]/20 bg-[#C8102E]/10 px-3 py-0.5 text-xs font-bold text-[#C8102E]">
              <Scale className="h-3.5 w-3.5" />
              <span>C²SA ARBITRATION 2.0</span>
            </span>
            <span className="font-mono text-xs text-slate-400">· SOVEREIGN VAULT</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Dispute Arbitration Center
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed">
            Inspect disputed escrow deposits, verify submitted deliverables and worklogs, and execute enforceable settlements.
          </p>
        </div>

        {/* Arbiter Clearance & Fullscreen Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="text-left text-xs">
              <p className="font-bold text-slate-900 leading-none">Arbiter Clearance</p>
              <p className="text-slate-400 text-[10px] font-mono mt-0.5">VAULT RESOLUTION LEVEL 3</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold font-mono text-slate-700 transition shadow-sm"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-[#C8102E]" />
                <span>Standard</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-[#C8102E]" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tactical HUD KPI Cards */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase">
            <span>Contested Escrow</span>
            <Wallet className="h-4 w-4 text-[#C8102E]" />
          </div>
          <p className="mt-2 text-xl font-extrabold font-mono text-slate-900">
            {formatEtb(totalContestedEtb)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Active Dispute Holds
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase">
            <span>Action Required</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-xl font-extrabold font-mono text-amber-600">
            {openCount} Case{openCount === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            Awaiting Initial Review
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase">
            <span>Under Review</span>
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold font-mono text-blue-600">
            {underReviewCount} Case{underReviewCount === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            Evidence Under Inspection
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase">
            <span>Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold font-mono text-emerald-600">
            {resolvedCount} Case{resolvedCount === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            Settlement Disbursed
          </p>
        </div>
      </div>

      {error && error !== "Admin only" && (
        <div className="mt-6 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mt-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Disputes ({disputes.length})
        </button>
        <button
          onClick={() => setActiveTab("open")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "open"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Action Required ({openCount})
        </button>
        <button
          onClick={() => setActiveTab("under_review")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "under_review"
              ? "bg-brand text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Under Investigation ({underReviewCount})
        </button>
        <button
          onClick={() => setActiveTab("resolved")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "resolved"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Resolved Cases ({resolvedCount})
        </button>
      </div>

      {/* Disputes List */}
      <div className="mt-6 space-y-6">
        {filteredDisputes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Scale className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">No disputes in this view</h3>
            <p className="mt-1 text-xs text-slate-500">
              There are no dispute cases matching the selected filter.
            </p>
          </div>
        ) : (
          filteredDisputes.map((d) => {
            const isBusy = !!actionBusy[d.id];
            const currentMode = modes[d.id] || "split";
            const splitPct = splitPcts[d.id] ?? 50;
            const categoryInfo = d.category ? DISPUTE_CATEGORIES[d.category] : null;

            const contractTotal = d.contract?.total_amount_etb || 0;
            const freelancerGross = Math.round(contractTotal * (splitPct / 100) * 100) / 100;
            const platformFee = Math.round(freelancerGross * 0.07 * 100) / 100;
            const freelancerNet = Math.round((freelancerGross - platformFee) * 100) / 100;
            const clientRefund = Math.round((contractTotal - freelancerGross) * 100) / 100;

            const statusBadge =
              d.status === "resolved" ? (
                <span className="badge-escrow">
                  <CheckCircle2 className="h-3 w-3" />
                  Resolved {d.outcome ? `(${d.outcome.toUpperCase()})` : ""}
                </span>
              ) : d.status === "under_review" ? (
                <span className="badge-brand">
                  <Eye className="h-3 w-3" />
                  Under Investigation
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                  <AlertTriangle className="h-3 w-3" />
                  Action Required
                </span>
              );

            return (
              <div
                key={d.id}
                className="card-surface space-y-5 rounded-3xl p-6 sm:p-7 transition-all border border-slate-200/90 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    {statusBadge}
                    {categoryInfo && (
                      <span className="rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                        {categoryInfo.label} ({categoryInfo.amharic})
                      </span>
                    )}
                    <span className="font-mono text-xs text-slate-500">
                      Case #{d.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-slate-400">
                      Opened {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {d.contract && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Escrow Value:</span>
                      <span className="text-sm font-extrabold text-slate-900 font-mono">
                        {formatEtb(d.contract.total_amount_etb)}
                      </span>
                      <Link
                        href={`/contracts/${d.contract_id}`}
                        target="_blank"
                        className="btn-secondary !py-1 !px-2.5 !text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <span>Inspect Workspace &amp; Worklogs</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Dispute Reason & Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Complainant Statement
                    </h4>
                    <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      &quot;{d.reason}&quot;
                    </p>
                    <p className="text-[11px] text-slate-500 pt-1">
                      Raised by:{" "}
                      <span className="font-bold text-slate-900">
                        {d.raiser?.full_name || d.raised_by}
                      </span>{" "}
                      ({d.raiser?.role || "user"})
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Evidence &amp; Artifacts
                    </h4>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
                      {d.evidence_url ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-brand shrink-0" />
                          <a
                            href={d.evidence_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-brand hover:underline truncate max-w-xs"
                          >
                            {d.evidence_url}
                          </a>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No external URL attached.</p>
                      )}

                      {d.evidence_notes && (
                        <p className="pt-1 text-slate-700 border-t border-slate-200/80">
                          <strong>Notes: </strong> {d.evidence_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resolution Summary If Resolved */}
                {d.status === "resolved" && (
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-5 text-xs text-emerald-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">
                        Arbitration Ruling: {d.outcome?.toUpperCase() || "RESOLVED"}
                      </p>
                      {d.updated_at && (
                        <span className="text-[11px] text-emerald-800">
                          Settled on {new Date(d.updated_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-800">{d.resolution_notes}</p>

                    {d.outcome === "split" && (
                      <div className="pt-2 border-t border-emerald-200/70 grid grid-cols-2 gap-4 font-mono">
                        <div>
                          <span className="text-[10px] text-emerald-700 uppercase">
                            Disbursed to Specialist ({d.split_pct}%)
                          </span>
                          <p className="font-extrabold text-sm text-emerald-900">
                            {formatEtb(d.freelancer_payout_etb || 0)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 uppercase">
                            Refunded to Client ({100 - (d.split_pct || 50)}%)
                          </span>
                          <p className="font-extrabold text-sm text-emerald-900">
                            {formatEtb(d.client_refund_etb || 0)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Controls for Admin */}
                {d.status !== "resolved" && (
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Arbitration Determination Mode
                      </span>

                      {/* Mode Switcher */}
                      <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl text-xs">
                        <button
                          type="button"
                          onClick={() => setModes((prev) => ({ ...prev, [d.id]: "split" }))}
                          className={`px-3 py-1 rounded-lg font-bold transition ${
                            currentMode === "split"
                              ? "bg-white text-brand-dark shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Partial Split (0–100%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setModes((prev) => ({ ...prev, [d.id]: "release" }))}
                          className={`px-3 py-1 rounded-lg font-bold transition ${
                            currentMode === "release"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Full Release (100%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setModes((prev) => ({ ...prev, [d.id]: "refund" }))}
                          className={`px-3 py-1 rounded-lg font-bold transition ${
                            currentMode === "refund"
                              ? "bg-rose-600 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Full Refund (100%)
                        </button>
                      </div>
                    </div>

                    {/* Split Slider Panel */}
                    {currentMode === "split" && (
                      <div className="rounded-xl border border-brand/20 bg-orange-50/40 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
                            <Sliders className="h-4 w-4" />
                            <span>Split Allocation Ratio</span>
                          </div>
                          <span className="text-sm font-extrabold text-brand-dark font-mono">
                            {splitPct}% Specialist / {100 - splitPct}% Client
                          </span>
                        </div>

                        <input
                          type="range"
                          min="5"
                          max="95"
                          step="5"
                          value={splitPct}
                          onChange={(e) =>
                            setSplitPcts((prev) => ({ ...prev, [d.id]: Number(e.target.value) }))
                          }
                          className="w-full accent-brand cursor-pointer"
                        />

                        {/* Quick Preset Buttons */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="text-[11px] text-slate-500 font-semibold self-center">Presets:</span>
                          {[25, 50, 70, 75, 80].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() =>
                                setSplitPcts((prev) => ({ ...prev, [d.id]: preset }))
                              }
                              className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-xs border ${
                                splitPct === preset
                                  ? "bg-brand text-white border-brand"
                                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                              }`}
                            >
                              {preset} / {100 - preset}
                            </button>
                          ))}
                        </div>

                        {/* Financial Distribution Preview Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <span className="text-[10px] text-emerald-700 font-bold uppercase">
                              Specialist Net Telebirr Payout
                            </span>
                            <p className="mt-1 text-base font-extrabold text-emerald-900">
                              {formatEtb(freelancerNet)}
                            </p>
                            <span className="text-[10px] text-slate-500 font-sans">
                              Gross: {formatEtb(freelancerGross)} - 7% fee
                            </span>
                          </div>

                          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                            <span className="text-[10px] text-rose-700 font-bold uppercase">
                              Client Refund
                            </span>
                            <p className="mt-1 text-base font-extrabold text-rose-900">
                              {formatEtb(clientRefund)}
                            </p>
                            <span className="text-[10px] text-slate-500 font-sans">
                              {100 - splitPct}% of total contract
                            </span>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">
                              Platform Trust Fee
                            </span>
                            <p className="mt-1 text-base font-extrabold text-slate-900">
                              {formatEtb(platformFee)}
                            </p>
                            <span className="text-[10px] text-slate-500 font-sans">
                              7% sovereign fee
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Justification Notes */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Arbitration Ruling Justification &amp; Notes:
                      </label>
                      <input
                        className="input-field mt-1 text-xs w-full"
                        placeholder="e.g. 70% released for completed backend architecture; 30% refunded for omitted Figma UI polish..."
                        value={notes[d.id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [d.id]: e.target.value }))
                        }
                      />
                    </div>

                    {/* Execution Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div>
                        {d.status === "open" && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => review(d.id)}
                            className="btn-secondary !text-xs font-bold inline-flex items-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5 text-brand" />
                            <span>Mark Under Investigation</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {currentMode === "split" && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => resolve(d.id, "split")}
                            className="btn-primary !text-xs font-bold inline-flex items-center gap-1.5 shadow-ochre"
                          >
                            <Percent className="h-3.5 w-3.5" />
                            <span>Execute {splitPct}% / {100 - splitPct}% Split Settlement</span>
                          </button>
                        )}

                        {currentMode === "refund" && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => resolve(d.id, "refund")}
                            className="btn-danger !text-xs font-bold inline-flex items-center gap-1.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Refund Full Escrow to Client</span>
                          </button>
                        )}

                        {currentMode === "release" && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => resolve(d.id, "release")}
                            className="btn-escrow !text-xs font-bold inline-flex items-center gap-1.5 shadow-glow-emerald"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Release Full Escrow to Specialist</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
