"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ArrowRight,
} from "lucide-react";
import { formatEtb } from "@/lib/utils";

const PRESETS = [10000, 25000, 50000, 100000, 250000];

export function EscrowCalculator() {
  const [amount, setAmount] = useState<number>(35000);
  const [milestoneCount, setMilestoneCount] = useState<number>(3);
  const [copied, setCopied] = useState<boolean>(false);

  const feeRate = 0.07;
  const platformFee = Math.round(amount * feeRate);
  const freelancerNet = amount - platformFee;

  const milestonePlan = useMemo(() => {
    if (milestoneCount === 1) {
      return [
        {
          name: "Complete Delivery & Final Verification",
          pct: 100,
          amount: amount,
          net: freelancerNet,
          days: 7,
        },
      ];
    }
    if (milestoneCount === 2) {
      return [
        {
          name: "Milestone 1: Prototype, Specs & Initial Architecture",
          pct: 40,
          amount: Math.round(amount * 0.4),
          net: Math.round(freelancerNet * 0.4),
          days: 5,
        },
        {
          name: "Milestone 2: Final Implementation, QA & Production Deployment",
          pct: 60,
          amount: Math.round(amount * 0.6),
          net: Math.round(freelancerNet * 0.6),
          days: 10,
        },
      ];
    }
    if (milestoneCount === 3) {
      return [
        {
          name: "Milestone 1: Architectural Blueprint & Core Design",
          pct: 30,
          amount: Math.round(amount * 0.3),
          net: Math.round(freelancerNet * 0.3),
          days: 5,
        },
        {
          name: "Milestone 2: Functional Core, API Integration & Telebirr Rails",
          pct: 40,
          amount: Math.round(amount * 0.4),
          net: Math.round(freelancerNet * 0.4),
          days: 10,
        },
        {
          name: "Milestone 3: Security Hardening, Audit & Handover",
          pct: 30,
          amount: Math.round(amount * 0.3),
          net: Math.round(freelancerNet * 0.3),
          days: 5,
        },
      ];
    }
    // 4 or 5 milestones
    const basePct = Math.floor(100 / milestoneCount);
    return Array.from({ length: milestoneCount }).map((_, i) => {
      const isLast = i === milestoneCount - 1;
      const pct = isLast ? 100 - basePct * (milestoneCount - 1) : basePct;
      const mAmount = Math.round((amount * pct) / 100);
      const mNet = Math.round((freelancerNet * pct) / 100);
      return {
        name: `Milestone ${i + 1}: Sprint ${i + 1} Deliverable & Staging Verification`,
        pct,
        amount: mAmount,
        net: mNet,
        days: (i + 1) * 4,
      };
    });
  }, [amount, milestoneCount, freelancerNet]);

  function copySchedule() {
    const text = `C²SA INTEL Escrow Breakdown:
Total Budget: ${formatEtb(amount)}
C²SA Platform Trust Fee (7%): ${formatEtb(platformFee)}
Specialist Net Payout: ${formatEtb(freelancerNet)}
Milestones (${milestoneCount}):
${milestonePlan
  .map(
    (m, i) =>
      `Phase ${i + 1} (${m.pct}%): ${formatEtb(m.amount)} [Specialist Net: ${formatEtb(
        m.net
      )}] — ${m.name}`
  )
  .join("\n")}
Secured by C²SA INTEL Cryptographic Escrow Protocol`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="card-surface rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <Calculator className="h-3.5 w-3.5 text-brand" />
            <span>MudayHub Escrow Simulator</span>
          </div>
          <h3 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            Milestone Escrow &amp; Payout Calculator
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Calculate exact milestone releases, sovereign trust fees, and net specialist earnings in ETB.
          </p>
        </div>

        <button
          type="button"
          onClick={copySchedule}
          className="btn-secondary !text-xs !py-2.5 !px-4 inline-flex items-center gap-2 self-start sm:self-center font-bold"
        >
          {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? "Schedule Copied!" : "Copy Schedule"}</span>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Budget Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Project Budget (ETB)
            </label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                ETB
              </span>
              <input
                type="number"
                min={1000}
                step={500}
                value={amount}
                onChange={(e) => setAmount(Math.max(1000, Number(e.target.value) || 0))}
                className="input-field !pl-14 !py-3 text-base font-bold font-mono text-slate-900"
              />
            </div>

            {/* Quick Presets */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-mono font-bold transition ${
                    amount === p
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {p.toLocaleString()} ETB
                </button>
              ))}
            </div>
          </div>

          {/* Milestone Count Selector */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Number of Milestones
              </label>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                {milestoneCount} {milestoneCount === 1 ? "Phase" : "Phases"}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={milestoneCount}
              onChange={(e) => setMilestoneCount(Number(e.target.value))}
              className="mt-3 w-full accent-slate-900"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 (Single-shot)</span>
              <span>2 (50/50)</span>
              <span>3 (Phased)</span>
              <span>4 (Sprints)</span>
              <span>5 (Enterprise)</span>
            </div>
          </div>

          {/* Fee Highlights */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Client Total Escrow Deposit:</span>
              <span className="font-mono font-extrabold text-slate-900">{formatEtb(amount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1">
                <span>Platform Trust &amp; Arbitration Fee (7%):</span>
              </span>
              <span className="font-mono font-bold text-slate-700">-{formatEtb(platformFee)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-900">Specialist Net Earning:</span>
              <span className="font-mono font-black text-emerald-700">{formatEtb(freelancerNet)}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
            <p className="flex items-start gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Funds are locked before work begins. Neither party can withdraw without mutual confirmation or arbiter ruling.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Direct Telebirr and CBE Birr instant settlement upon client milestone approval.</span>
            </p>
          </div>
        </div>

        {/* Milestone Schedule Preview Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Generated Milestone Schedule ({milestonePlan.length})
            </h4>
            <span className="text-[11px] font-mono text-emerald-700 font-bold">
              100% Fully Allocated
            </span>
          </div>

          <div className="space-y-3">
            {milestonePlan.map((m, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-mono font-bold text-white">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{m.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 pl-7 block">
                      Target Turnaround: ~{m.days} days &middot; {m.pct}% of project total
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-sm font-black text-slate-900">
                      {formatEtb(m.amount)}
                    </span>
                    <span className="block text-[10px] font-mono text-emerald-700 font-bold">
                      Net: {formatEtb(m.net)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/jobs/new"
              className="btn-c2sa !py-3 !px-6 !text-xs font-bold shadow-ochre inline-flex items-center gap-2"
            >
              <span>Post Project with This Schedule</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="btn-secondary !py-3 !px-5 !text-xs font-semibold"
            >
              Read Arbitration Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
