import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Lock,
  ShieldCheck,
  Sparkles,
  Wallet,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Browse Services or Publish an RFP",
    titleAm: "አገልግሎቶችን መምረጥ ወይም ፕሮጀክት መለጠፍ",
    body: "Clients have two frictionless options: order ready fixed-scope 3-tier services (turnaround in 2-7 days) or post custom project RFPs with tailored ETB budgets. No spam bidding.",
    icon: Sparkles,
  },
  {
    n: "02",
    title: "Programmatic Escrow Funding",
    titleAm: "ክፍያን በቴሌብር እና በባንክ ዋስትና ማስያዝ",
    body: "Once terms or proposals are accepted, the client deposits project or milestone funds into non-custodial escrow via Telebirr or CBE Birr. Funds are secured before work commences.",
    icon: Lock,
  },
  {
    n: "03",
    title: "Collaborate in High-Trust Workspace",
    titleAm: "ያለ ክፍያ ስጋት በነፃነት መስራትና ሪፖርት ማቅረብ",
    body: "Specialists submit interim worklog checkpoints, code repos, and Figma deliverables. In-app messaging includes anti-circumvention safety filters to protect your escrow guarantee.",
    icon: ShieldCheck,
  },
  {
    n: "04",
    title: "Verify Deliverables & Mint SHA-256 Deed",
    titleAm: "ስራን ማረጋገጥ፣ ክፍያን መልቀቅ እና ሰርተፍኬት ማመንጨት",
    body: "Review work against accepted criteria. Release funds to the specialist's Telebirr account with one click, minting an immutable cryptographic Trust Deed for their verified reputation.",
    icon: Wallet,
  },
];

const COMPARISON = [
  {
    feature: "Payment Security",
    telegram: "Extreme risk (50%+ prepayment fraud or ghosting after delivery)",
    c2sa: "100% Programmatic Telebirr / CBE Escrow locked before work starts",
  },
  {
    feature: "Specialist Vetting",
    telegram: "Unverified claims, stolen portfolio links, anonymous accounts",
    c2sa: "C²SA Vetted verification, skill assessments, verified phone & GitHub",
  },
  {
    feature: "Dispute Handling",
    telegram: "Zero recourse. Blocked on Telegram with lost funds",
    c2sa: "Structured arbitration center with 3-way split capability",
  },
  {
    feature: "Reputation Record",
    telegram: "Ephemeral chat history that cannot be referenced",
    c2sa: "Content-addressed cryptographic SHA-256 Trust Deeds",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 space-y-16">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/30 bg-[#1A222D] p-2 shadow-glow">
          <Image
            src="/logo-emblem.png"
            alt="MudayHub Freelance"
            width={48}
            height={48}
            className="object-contain"
          />
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-amber-50 px-3.5 py-1 text-xs font-bold text-brand">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>MudayHub Sovereign Freelance Protocol</span>
        </div>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          How MudayHub Works
        </h1>
        <p className="font-ethio mt-2 text-sm font-semibold text-slate-500">
          እንዴት እንደሚሰራ · ደህንነቱ የተጠበቀ የዲጂታል ስራዎች እና ኢንጂነሪንግ መድረክ
        </p>
        <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Explore ready services, publish custom project requests, review verified proposals, and collaborate
          with cryptographic milestone escrow backed by domestic Ethiopian payment rails.
        </p>
      </div>

      {/* 4 Steps Timeline */}
      <div className="space-y-6">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.n}
              className="card-surface group relative flex flex-col sm:flex-row items-start gap-6 rounded-3xl border border-slate-200/90 p-8 transition hover:border-slate-300 shadow-sm"
            >
              <div className="flex items-center gap-4 sm:flex-col sm:items-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-900 font-mono ring-1 ring-slate-200">
                  {s.n}
                </span>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:text-brand transition">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-brand transition">
                    {s.title}
                  </h2>
                  <span className="font-ethio text-xs text-slate-500">
                    ({s.titleAm})
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                  {s.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform vs Informal Comparison Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Trust Engineering
          </span>
          <h3 className="mt-1 text-2xl font-black text-slate-900">
            Why Informal Channels Fail in Ethiopia
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Comparing unmoderated Telegram freelance channels with C²SA INTEL Sovereign Escrow Grid.
          </p>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 w-1/4">Factor</th>
                <th className="pb-3 w-3/8 text-rose-700">Telegram Groups &amp; Private DMs</th>
                <th className="pb-3 w-3/8 text-emerald-700">C²SA INTEL Freelance Grid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {COMPARISON.map((c, i) => (
                <tr key={i} className="py-3">
                  <td className="py-3 font-bold text-slate-900">{c.feature}</td>
                  <td className="py-3 text-slate-500 flex items-start gap-1.5">
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{c.telegram}</span>
                  </td>
                  <td className="py-3 font-medium text-slate-900">
                    <span className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{c.c2sa}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Card */}
      <div className="card-surface rounded-3xl border border-slate-200 p-8 sm:p-10 space-y-6 bg-white shadow-sm">
        <h3 className="text-2xl font-black text-slate-900">
          Ready to experience high-trust digital engineering?
        </h3>
        <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600">
          Whether you are an enterprise seeking vetted software engineers or an independent specialist
          looking for protected, reliable project contracts, MudayHub delivers the infrastructure you need.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
          <Link href="/register" className="btn-primary !py-3 !px-6 font-bold shadow-ochre">
            <span>Join MudayHub Network</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/escrow" className="btn-secondary !py-3 !px-6 font-semibold">
            <span>Escrow &amp; Calculator</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
