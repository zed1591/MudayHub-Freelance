import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  LockKeyhole,
  Scale,
  Wallet,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { EscrowCalculator } from "@/components/escrow/EscrowCalculator";

const controls = [
  {
    title: "Cryptographic HMAC Verification",
    body: "Payment webhooks from Telebirr and Chapa are verified using SHA-256 HMAC signatures before a contract or milestone can be marked funded.",
    icon: LockKeyhole,
  },
  {
    title: "Strict State-Machine Invariants",
    body: "Funds can only transition through verified states (awaiting_deposit → funded → work_submitted → completed). Replay attacks and double-releases are cryptographically blocked.",
    icon: Wallet,
  },
  {
    title: "Neutral 3-Way Split Arbitration",
    body: "When scope or delivery criteria conflict, either party can trigger formal dispute arbitration. Arbitrators can issue 100% releases, 100% refunds, or custom percentage split payouts.",
    icon: Scale,
  },
];

const stateFlow = [
  { state: "awaiting_deposit", label: "Awaiting Deposit", desc: "Contract signed, awaiting client funds confirmation on Telebirr/CBE rail." },
  { state: "funded", label: "Escrow Locked", desc: "Funds locked into sovereign escrow node. Freelancer begins sprint delivery safely." },
  { state: "work_submitted", label: "Deliverables In Review", desc: "Specialist submits code, design, and worklogs. Client inspects deliverables." },
  { state: "completed", label: "Settled & Deed Minted", desc: "Client approves delivery. Funds release to Telebirr phone and SHA-256 Deed is generated." },
];

export default function EscrowPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 space-y-16">
      {/* Header */}
      <header className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-50 px-3.5 py-1 text-xs font-bold text-[#C8102E]">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          <span>C²SA INTEL Non-Custodial Escrow Protocol</span>
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          High-Trust Milestone Escrow <span className="text-[#C8102E]">&middot; የዋስትና አሰራር</span>
        </h1>
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600">
          C²SA INTEL eliminates freelance payment risk in Ethiopia. Funds are locked prior to sprint initiation,
          guaranteeing specialist payout upon delivery while protecting client capital against non-delivery.
        </p>
      </header>

      {/* Interactive Simulator Component */}
      <section aria-label="Interactive Escrow Calculator">
        <EscrowCalculator />
      </section>

      {/* State Machine Visualization */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C8102E]">
            Deterministic Lifecycle
          </span>
          <h2 className="mt-1 text-2xl font-black text-slate-900">
            Escrow State Machine Architecture
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Every contract follows an immutable state progression enforced by database triggers and signed transition asserts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stateFlow.map((s, idx) => (
            <div
              key={s.state}
              className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 font-mono text-xs font-bold text-white">
                  0{idx + 1}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  State {idx + 1}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 pt-1">{s.label}</h3>
              <p className="text-xs leading-relaxed text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security Invariants */}
      <section aria-labelledby="controls-title" className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Security by Design
          </span>
          <h2 id="controls-title" className="mt-1 text-2xl font-black text-slate-900">
            Cryptographic Safety Invariants
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {controls.map(({ title, body, icon: Icon }) => (
            <article
              key={title}
              className="card-surface rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-3"
            >
              <span className="inline-flex rounded-xl bg-rose-50 border border-rose-100 p-2.5 text-[#C8102E]">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
              <p className="text-xs leading-relaxed text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Production Readiness & Compliance Notice */}
      <section className="rounded-3xl border border-amber-300 bg-amber-50/60 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <CircleAlert className="h-5 w-5 text-amber-700" />
          <h2 className="font-bold text-amber-950 text-base">
            Regulatory &amp; Payment Rail Disclosures
          </h2>
        </div>
        <p className="text-xs text-amber-900/90 leading-relaxed">
          Production deposits and automated payouts are gated until authorized payment service provider (PSP)
          agreements and NBE compliance certifications are finalized. In development and walkthrough modes,
          mock payment events simulate live Telebirr and CBE Birr transaction confirmations.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-950 pt-2 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>Zero deposit leakage: fees assessed only upon completed release</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>Immutable SHA-256 Trust Deeds generated on settlement</span>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
        <Link href="/jobs" className="btn-c2sa !py-3 !px-6 font-bold shadow-ochre">
          Explore Projects <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <Link href="/verify" className="btn-secondary !py-3 !px-5 font-bold">
          Verify Cryptographic Trust Deeds
        </Link>
        <a
          href="mailto:contact.ccsa.intel@gmail.com"
          className="btn-secondary !py-3 !px-5 font-semibold text-slate-700"
        >
          Contact C²SA Arbiter
        </a>
      </div>
    </main>
  );
}
