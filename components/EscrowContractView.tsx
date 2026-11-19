"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldCheck,
  Shield,
  Wallet,
  Layers,
  Activity,
  Copy,
  Check,
} from "lucide-react";
import { formatEtb } from "@/lib/utils";
import { ContractChat } from "@/components/ContractChat";
import { EscrowStepper } from "@/components/escrow/EscrowStepper";
import { MilestonesTable } from "@/components/escrow/MilestonesTable";
import { DeliverableSubmissionBox } from "@/components/escrow/DeliverableSubmissionBox";
import { DisputeBox } from "@/components/escrow/DisputeBox";
import { ReviewRatingBox } from "@/components/escrow/ReviewRatingBox";
import { WorklogFeed } from "@/components/escrow/WorklogFeed";
import type { Contract, Dispute, Milestone, Profile, Review, UserRole } from "@/lib/types";

interface Props {
  contract: Contract & {
    jobs?: { title: string; category?: string };
    gigs?: { title: string; category?: string; cover_image?: string };
    client?: Pick<Profile, "full_name" | "phone">;
    freelancer?: Pick<Profile, "full_name" | "telebirr_number">;
    reviews?: Review[];
    milestones?: Milestone[];
  };
  role: UserRole;
  userId: string;
  disputes?: Dispute[];
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function EscrowContractView({ contract: initial, role, userId }: Props) {
  const [contract, setContract] = useState(initial);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payoutInfo, setPayoutInfo] = useState<string | null>(null);
  const [refCopied, setRefCopied] = useState(false);

  function copyReference() {
    navigator.clipboard.writeText(contract.payment_reference || contract.id);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  }

  // Sync state on prop changes
  useEffect(() => {
    setContract(initial);
  }, [initial]);

  async function action(path: string, body: Record<string, unknown>) {
    setBusy(true);
    setError("");

    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setBusy(false);

      if (!res.ok) {
        setError(data.error || "Operation failed");
        return;
      }

      if (data.session?.checkoutUrl) {
        window.location.href = data.session.checkoutUrl;
        return;
      }

      if (data.contract) {
        setContract((prev) => ({
          ...prev,
          ...data.contract,
          milestones: data.contract.milestones || prev.milestones,
        }));
      }

      if (data.payout) {
        setPayoutInfo(
          `Automated payout dispatched: ${data.payout.amountEtb} ETB (${data.payout.transferId}) to ${data.payout.destination}`
        );
      }
    } catch {
      setBusy(false);
      setError("Network error occurred");
    }
  }

  async function handleRevision() {
    if (!revisionNotes.trim()) return;
    await action(`/api/contracts/${contract.id}/revision`, { notes: revisionNotes });
    setShowRevisionInput(false);
    setRevisionNotes("");
  }

  async function handleReviewSubmit(rating: number, comment: string) {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractId: contract.id,
        targetId: role === "client" ? contract.freelancer_id : contract.client_id,
        gigId: contract.gig_id || undefined,
        rating,
        comment,
      }),
    });

    const data = await res.json();
    if (res.ok && data.review) {
      setContract((prev) => ({
        ...prev,
        reviews: [...(prev.reviews || []), data.review],
      }));
    }
  }

  const isClient = role === "client";
  const isFreelancer = role === "freelancer";
  const isAdmin = role === "admin";
  const title = contract.gigs?.title || contract.jobs?.title || "Contract Engagement";
  const counterpartyName = isClient
    ? contract.freelancer?.full_name || "Specialist"
    : contract.client?.full_name || "Client";

  const approvedMilestones = (contract.milestones || []).filter((m) => m.status === "completed").length;
  const totalMilestones = (contract.milestones || []).length;

  return (
    <div className="space-y-6">
      {/* 1. Tactical HUD Header Ribbon */}
      <div className="card-surface p-6 sm:p-7 rounded-3xl border border-slate-200/90 bg-white shadow-sm flex flex-wrap items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-brand">
              {contract.package_tier ? `${contract.package_tier} Service Package` : "Scoped Project RFP"}
            </span>
            {contract.gigs?.category && (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                {contract.gigs.category}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              STATUS: {contract.escrow_status.toUpperCase().replace(/_/g, " ")}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
            <span className="inline-flex items-center gap-1.5">
              REF: <strong className="text-slate-800">{contract.payment_reference || contract.id.slice(0, 12)}</strong>
              <button
                type="button"
                onClick={copyReference}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                title="Copy Escrow Reference"
              >
                {refCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </span>
            <span>·</span>
            <span>
              PARTICIPANTS:{" "}
              <strong className="text-slate-700">{contract.client?.full_name || "Client"}</strong> &amp;{" "}
              <strong className="text-slate-700">{contract.freelancer?.full_name || "Specialist"}</strong>
            </span>
          </div>
        </div>

        {/* Quick Amount Summary */}
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            The Muday Vault Escrow
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
            {formatEtb(contract.total_amount_etb)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Specialist Net (93%):{" "}
            <strong className="text-brand font-mono font-bold">
              {formatEtb(contract.freelancer_net_etb)}
            </strong>
          </p>
        </div>
      </div>

      {/* 2. Tactical 4-Card HUD Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Vault Escrow */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">Vault Balance</span>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold font-mono text-slate-900">
            {formatEtb(contract.total_amount_etb)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            100% Birr Secured
          </p>
        </div>

        {/* Card 2: Payout Rail */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">Net Payout Rail</span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold font-mono text-brand">
            {formatEtb(contract.freelancer_net_etb)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono truncate">
            {contract.freelancer?.telebirr_number
              ? `Telebirr: ${contract.freelancer.telebirr_number}`
              : "7% Fee Deducted"}
          </p>
        </div>

        {/* Card 3: Milestone Progress */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">Milestones</span>
            <Layers className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold font-mono text-slate-900">
            {totalMilestones > 0 ? `${approvedMilestones}/${totalMilestones} Released` : "Single Checkpoint"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            {totalMilestones > 0
              ? `${Math.round((approvedMilestones / totalMilestones) * 100)}% Milestone Completed`
              : "Direct Delivery Rail"}
          </p>
        </div>

        {/* Card 4: Trust Deed / Verification */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">C²SA Verification</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold font-mono text-slate-900">
            {contract.deed_hash ? "Trust Deed Minted" : "Verified Escrow"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-mono truncate">
            {contract.deed_hash ? `${contract.deed_hash.slice(0, 16)}…` : "Anti-Disintermediation Protected"}
          </p>
        </div>
      </div>

      {/* 3. Dual-Pane Tactical Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Primary Milestones & Work Workflow (lg:col-span-7 xl:col-span-8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Stepper Progress */}
          <EscrowStepper
            status={contract.escrow_status}
            revisionRequested={contract.revision_requested}
            revisionNotes={contract.revision_notes}
          />

          {/* Action Console */}
          <div className="card-surface space-y-6 p-6 sm:p-7 rounded-3xl border border-slate-200/90 bg-white shadow-sm">
            {/* Step Guide Banner */}
            <div className="rounded-2xl border border-brand/20 bg-orange-50/70 p-4 text-xs text-slate-800 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-brand-dark">👉 Active Step:</span>
                <span>
                  {contract.escrow_status === "awaiting_deposit" &&
                    (isClient
                      ? "Review contract details and proceed to secure escrow funding."
                      : "Waiting for the client to confirm payment terms before work begins.")}
                  {contract.escrow_status === "funded" &&
                    (isFreelancer
                      ? "Escrow is locked and funded! Complete the work and submit your deliverable URL or file below."
                      : "Work in progress. Freelancer will submit deliverables for your inspection.")}
                  {contract.escrow_status === "work_submitted" &&
                    (isClient
                      ? "Deliverables submitted! Inspect the submission and choose 'Approve & Release' or 'Request Revision'."
                      : "Work submitted. Waiting for client inspection and payout approval.")}
                  {contract.escrow_status === "completed" &&
                    "Contract settled! Telebirr payout disbursed. Please submit your review below."}
                  {contract.escrow_status === "disputed" &&
                    "Dispute under arbitration review. Funds remain frozen in escrow."}
                </span>
              </div>
            </div>

            {contract.work_submission_notes && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                  Project Brief &amp; Requirements:
                </span>
                <p className="mt-1 text-slate-700 leading-relaxed">{contract.work_submission_notes}</p>
              </div>
            )}

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

            {isAdmin && (
              <div className="rounded-2xl border border-brand/30 bg-orange-50 p-3.5 text-xs text-brand-dark font-medium">
                Arbiter Mode: Admin dispute resolution and contract review enabled.
              </div>
            )}

            {/* Action: Client Deposit */}
            {isClient && contract.escrow_status === "awaiting_deposit" && (
              <div className="rounded-2xl border border-brand/25 bg-orange-50/50 p-6 space-y-4">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <span>Ready to Fund Escrow</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Review the agreed amount and contract details. Payment is protected in escrow and released only upon your final milestone approval.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  className="btn-primary !py-3 !px-7 text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-ochre"
                  onClick={() => action("/api/escrow/checkout", { contractId: contract.id })}
                >
                  <Wallet className="h-4 w-4" />
                  <span>Continue to payment · {formatEtb(contract.total_amount_etb)}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Action: Freelancer Submit Work */}
            {isFreelancer && contract.escrow_status === "funded" && (
              <DeliverableSubmissionBox
                contractId={contract.id}
                busy={busy}
                onSubmit={async (url) => {
                  await action("/api/escrow/submit-work", {
                    contractId: contract.id,
                    work_submission_url: url,
                  });
                }}
              />
            )}

            {/* Deliverable Review Display */}
            {contract.work_submission_url && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/60 p-5 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Submitted Deliverable</span>
                </div>
                {contract.work_submission_url.startsWith("/api/storage/download") ? (
                  <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-xl p-3 border border-emerald-200">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-5 w-5 text-brand" />
                      <span className="font-semibold text-slate-900">Private Deliverable Package</span>
                    </div>
                    <a
                      href={contract.work_submission_url}
                      download
                      className="btn-primary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Deliverable</span>
                    </a>
                  </div>
                ) : (
                  <div>
                    <a
                      href={contract.work_submission_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline font-semibold break-all inline-flex items-center gap-1.5"
                    >
                      <span>{contract.work_submission_url}</span>
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Action: Client Review Options */}
            {isClient && contract.escrow_status === "work_submitted" && (
              <div className="space-y-5 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6">
                <h3 className="text-base font-bold text-slate-900">Client Review &amp; Approval</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Inspect the delivered work. If satisfied, release the funds directly to the
                  freelancer&apos;s Telebirr wallet. If adjustments are required, you can request a revision.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    className="btn-escrow !text-xs !py-3 !px-6 font-bold shadow-glow-emerald"
                    onClick={() => action("/api/escrow/release", { contractId: contract.id })}
                  >
                    Approve &amp; Release Funds ({formatEtb(contract.freelancer_net_etb)})
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    className="btn-secondary !text-xs !py-3 flex items-center gap-2"
                    onClick={() => setShowRevisionInput(!showRevisionInput)}
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-brand" />
                    <span>Request Revision</span>
                  </button>
                </div>

                {showRevisionInput && (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                    <label className="text-xs font-semibold text-slate-700">
                      Revision Details &amp; Change Requests
                    </label>
                    <textarea
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="Detail specifically what needs fixing or modifying..."
                      className="input-field text-xs min-h-[80px]"
                    />
                    <button
                      type="button"
                      disabled={busy || !revisionNotes.trim()}
                      onClick={handleRevision}
                      className="btn-primary !text-xs shadow-ochre"
                    >
                      Send Revision Request
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Disputed arbitration alert */}
            {contract.escrow_status === "disputed" && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50/80 p-6 text-rose-950 space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                  <span className="font-bold text-base text-rose-950">Under Active Platform Arbitration</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Escrow funds are safely frozen in the C²SA INTEL Sovereign Vault. An independent arbiter is reviewing all contract worklogs, submitted deliverables, and chat records. A fair resolution (release, refund, or partial split settlement) will be issued.
                </p>
              </div>
            )}

            {/* Completed status with Trust Deed Certificate */}
            {contract.escrow_status === "completed" && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 p-6 text-emerald-900 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-base text-emerald-950">Contract Completed &amp; Escrow Settled</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {payoutInfo || "Funds have been disbursed to the specialist's registered payout destination."}
                </p>

                {contract.deed_hash && (
                  <div className="pt-3 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900">
                        Cryptographic Trust Deed Minted
                      </span>
                    </div>
                    <Link
                      href={`/verify/${contract.deed_hash}`}
                      className="btn-escrow !text-xs !py-1.5 !px-3 font-bold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <span>View Verification Certificate</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Milestones Roadmap */}
          <MilestonesTable
            milestones={contract.milestones || []}
            role={role}
            busy={busy}
            onReleaseMilestone={(milestoneId) =>
              action("/api/escrow/release", { contractId: contract.id, milestoneId })
            }
          />

          {/* Intermediate Deliverable & Worklog Feed */}
          <WorklogFeed
            contractId={contract.id}
            role={role}
            milestones={contract.milestones || []}
            isLocked={contract.escrow_status === "completed" || contract.escrow_status === "refunded"}
          />

          {/* Review & Rating Form (Post-Release) */}
          {contract.escrow_status === "completed" && (
            <ReviewRatingBox
              counterpartyName={counterpartyName}
              reviews={contract.reviews || []}
              userId={userId}
              onSubmitReview={handleReviewSubmit}
            />
          )}
        </div>

        {/* Right Column: Tactical Rail & Real-Time Chat (lg:col-span-5 xl:col-span-4 lg:sticky lg:top-4 space-y-6) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Real-Time Contract Chat */}
          <ContractChat
            contractId={contract.id}
            userId={userId}
            escrowStatus={contract.escrow_status}
          />

          {/* Counterparty & Clearance Card */}
          <div className="card-surface p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-500 font-bold">
                Engagement Parties
              </span>
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Client:</span>
                <span className="font-bold text-slate-900">{contract.client?.full_name || "Enterprise Client"}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Specialist:</span>
                <span className="font-bold text-slate-900">{contract.freelancer?.full_name || "Specialist"}</span>
              </div>
              {contract.freelancer?.telebirr_number && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-emerald-700 font-medium">Payout Dest:</span>
                  <span className="font-mono font-bold text-emerald-900">{contract.freelancer.telebirr_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dispute Trigger Box */}
          {contract.escrow_status !== "completed" &&
            contract.escrow_status !== "refunded" &&
            contract.escrow_status !== "awaiting_deposit" &&
            contract.escrow_status !== "disputed" && (
              <DisputeBox
                busy={busy}
                onRaiseDispute={async (data) => {
                  await action("/api/escrow/dispute", {
                    contractId: contract.id,
                    category: data.category,
                    reason: data.reason,
                    evidence_url: data.evidence_url,
                    evidence_notes: data.evidence_notes,
                  });
                }}
              />
            )}

          <p className="flex items-start gap-2.5 text-xs text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Secured by MudayHub Escrow Protocol with automated HMAC webhook verification and anti-disintermediation filters.
          </p>
        </div>
      </div>
    </div>
  );
}
