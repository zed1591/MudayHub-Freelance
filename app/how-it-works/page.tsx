"use client";

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
import { useLanguage } from "@/components/LanguageProvider";

const STEPS = [
  {
    n: "01",
    title: "Browse Services or Publish an RFP",
    titleAm: "አገልግሎቶችን መምረጥ ወይም ፕሮጀክት መለጠፍ",
    body: "Clients have two frictionless options: order ready fixed-scope 3-tier services (turnaround in 2-7 days) or post custom project RFPs with tailored ETB budgets. No spam bidding.",
    bodyAm: "አሰሪዎች ሁለት ቀላል አማራጮች አሏቸው፡ ዝግጁ የሆኑ የ3-ደረጃ አገልግሎቶችን በቋሚ ዋጋ ማዘዝ (ከ2-7 ቀናት ውስጥ የሚጠናቀቁ) ወይም የድርጅታቸውን ብጁ ፕሮጀክት ማውጣት።",
    icon: Sparkles,
  },
  {
    n: "02",
    title: "Programmatic Escrow Funding",
    titleAm: "ክፍያን በቴሌብር እና በባንክ ዋስትና ማስያዝ",
    body: "Once terms or proposals are accepted, the client deposits project or milestone funds into non-custodial escrow via Telebirr or CBE Birr. Funds are secured before work commences.",
    bodyAm: "የስራ ውል ወይም የዋጋ ሀሳብ እንደተስማማ፣ አሰሪው የፕሮጀክቱን ወይም የወቅቱን ክፍያ በቴሌብር ወይም በንግድ ባንክ ወደ ታማኝ የዋስትና ሂሳብ ያስቀምጣል። ስራ ከመጀመሩ በፊት ክፍያ የተረጋገጠ ነው።",
    icon: Lock,
  },
  {
    n: "03",
    title: "Collaborate in High-Trust Workspace",
    titleAm: "ያለ ክፍያ ስጋት በነፃነት መስራትና ሪፖርት ማቅረብ",
    body: "Specialists submit interim worklog checkpoints, code repos, and Figma deliverables. In-app messaging includes anti-circumvention safety filters to protect your escrow guarantee.",
    bodyAm: "ባለሙያው የስራውን ሂደት ሪፖርቶች፣ ኮዶች እና ዲዛይኖችን በጋራ የስራ ክፍል ውስጥ ያቀርባል። የመልእክት ልውውጡ የክፍያ ዋስትናዎ እንዳይጣስ የደህንነት ጥበቃ አለው።",
    icon: ShieldCheck,
  },
  {
    n: "04",
    title: "Verify Deliverables & Mint SHA-256 Deed",
    titleAm: "ስራን ማረጋገጥ፣ ክፍያን መልቀቅ እና ሰርተፍኬት ማመንጨት",
    body: "Review work against accepted criteria. Release funds to the specialist's Telebirr account with one click, minting an immutable cryptographic Trust Deed for their verified reputation.",
    bodyAm: "የተሰራውን ስራ በተስማሙበት መስፈርት መሰረት መርምረው ያረጋግጡ። በአንድ ጠቅታ ክፍያውን ወደ ባለሙያው ቴሌብር ይልቀቁ፣ ለባለሙያውም የማይቀየር የዲጂታል ሰርተፍኬት ይመነጫል።",
    icon: Wallet,
  },
];

const COMPARISON = [
  {
    feature: "Payment Security",
    featureAm: "የክፍያ ዋስትና",
    telegram: "Extreme risk (50%+ prepayment fraud or ghosting after delivery)",
    telegramAm: "ከፍተኛ ስጋት (የቅድመ ክፍያ ማጭበርበር ወይም ስራ ከተረከቡ በኋላ አለመክፈል)",
    c2sa: "100% Programmatic Telebirr / CBE Escrow locked before work starts",
    c2saAm: "100% በቴሌብር እና በንግድ ባንክ የተጠበቀ የዋስትና አሰራር",
  },
  {
    feature: "Specialist Vetting",
    featureAm: "የባለሙያ ብቃት ማረጋገጫ",
    telegram: "Unverified claims, stolen portfolio links, anonymous accounts",
    telegramAm: "ያልተረጋገጠ መረጃ፣ የተሰረቁ ፖርትፎሊዮዎች እና ማንነታቸው ያልታወቀ አካላት",
    c2sa: "MudayHub Vetted verification, skill assessments, verified phone & GitHub",
    c2saAm: "የተረጋገጠ ማንነት፣ የተፈተነ የክህሎት ማረጋገጫ፣ የተረጋገጠ ስልክ እና GitHub",
  },
  {
    feature: "Dispute Handling",
    featureAm: "የክርክር አፈታት",
    telegram: "Zero recourse. Blocked on Telegram with lost funds",
    telegramAm: "ምንም መፍትሄ የለም፤ ብሎክ ተደርጎ ገንዘብን ማጣት",
    c2sa: "Structured arbitration center with 3-way split capability",
    c2saAm: "ገለልተኛ የሽምግልና ማዕከል ፍትሃዊ ክፍፍል የማድረግ ብቃት ያለው",
  },
  {
    feature: "Verifiable Track Record",
    featureAm: "የተረጋገጠ የስራ ታሪክ",
    telegram: "Easily faked screenshots and disposable channels",
    telegramAm: "በቀላሉ የሚቀየሩ ፎቶዎች እና ጊዜያዊ ቻናሎች",
    c2sa: "SHA-256 cryptographic Trust Deeds minted on completed contracts",
    c2saAm: "በእያንዳንዱ የተጠናቀቀ ስራ ላይ የሚመነጭ የማይቀየር የዲጂታል ሰርተፍኬት",
  },
];

export default function HowItWorksPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 p-2 border border-brand/20">
          <Image
            src="/logo-emblem.png"
            alt="MudayHub"
            width={32}
            height={32}
            className="object-contain"
          />
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-amber-50 px-3.5 py-1 text-xs font-bold text-brand">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>{isAm ? "የሙዳይ ፍሪላንስ ስርዓት" : "MudayHub Freelance Protocol"}</span>
        </div>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          {isAm ? "ሙዳይሀብ እንዴት ይሰራል?" : "How MudayHub Works"}
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          {isAm
            ? "ደህንነቱ የተጠበቀ የዲጂታል ስራዎች እና ኢንጂነሪንግ መድረክ"
            : "Verified Digital Engineering & Professional Freelance Marketplace"}
        </p>
        <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
          {isAm
            ? "ዝግጁ የሆኑ አገልግሎቶችን ይመልከቱ፣ አዳዲስ የፕሮጀክት ጨረታዎችን ያውጡ፣ እና በቴሌብር እና በኢትዮጵያ ንግድ ባንክ የዋስትና አሰራር በልበ ሙሉነት ይስሩ።"
            : "Explore ready services, publish custom project requests, review verified proposals, and collaborate with cryptographic milestone escrow backed by domestic Ethiopian payment rails."}
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
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-brand transition">
                  {isAm ? s.titleAm : s.title}
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                  {isAm ? s.bodyAm : s.body}
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
            {isAm ? "የታማኝነት ንጽጽር" : "Trust Engineering"}
          </span>
          <h2 className="mt-1 text-2xl font-black text-slate-900">
            {isAm
              ? "የሙዳይሀብ ዋስትና ከቴሌግራም መደበኛ ያልሆኑ ስራዎች ጋር ሲነፃፀር"
              : "MudayHub Escrow vs Informal Channels (Telegram)"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isAm
              ? "ለምን በቴሌብር የዋስትና አሰራር በኩል መስራት ሁለቱንም ወገኖች ከአደጋ ይጠብቃል?"
              : "Why verified milestone escrow protects both businesses and developers from insolvency and fraud."}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 pr-4">{isAm ? "መስፈርት" : "Criteria"}</th>
                <th className="py-3 px-4 text-rose-600 font-bold">
                  {isAm ? "መደበኛ ያልሆነ (ቴሌግራም/ፌስቡክ)" : "Informal (Telegram/Direct Chat)"}
                </th>
                <th className="py-3 pl-4 text-emerald-700 font-bold">
                  {isAm ? "ሙዳይሀብ የዋስትና መድረክ" : "MudayHub Protected Escrow"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARISON.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="py-4 pr-4 font-bold text-slate-800">{isAm ? c.featureAm : c.feature}</td>
                  <td className="py-4 px-4 text-rose-700/90 flex items-start gap-1.5">
                    <XCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                    <span>{isAm ? c.telegramAm : c.telegram}</span>
                  </td>
                  <td className="py-4 pl-4 text-emerald-800 font-medium">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                      <span>{isAm ? c.c2saAm : c.c2sa}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Box */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl font-black text-slate-900">
            {isAm ? "ስራ ለመጀመር ዝግጁ ኖት?" : "Ready to Start Building?"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            {isAm
              ? "የፕሮጀክት ጨረታ ያውጡ ወይም የተመረጡ የቴክኖሎጂ አገልግሎቶችን በቴሌብር የዋስትና አሰራር ይዘዙ።"
              : "Commission vetted Ethiopian engineers with zero prepayment risk or publish your services today."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/jobs/new"
            className="btn-primary !py-3 !px-5 !text-xs font-bold shadow-ochre inline-flex items-center gap-2"
          >
            <span>{isAm ? "የፕሮጀክት ጨረታ ይለጥፉ" : "Post a Project RFP"}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/gigs"
            className="btn-secondary !py-3 !px-5 !text-xs font-bold"
          >
            <span>{isAm ? "አገልግሎቶችን ያስሱ" : "Explore Services"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
