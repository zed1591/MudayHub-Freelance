import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Code2,
  FileCheck2,
  Search,
  ShieldCheck,
  Sparkles,
  Lock,
  Cpu,
  Mail,
  Zap,
} from "lucide-react";
import { GIG_CATEGORIES } from "@/lib/types";
import { HomeCategoryTabs } from "@/components/HomeCategoryTabs";
import { EscrowCalculator } from "@/components/escrow/EscrowCalculator";

const steps = [
  {
    number: "01",
    title: "Define Objectives or Order Ready Gigs",
    text: "Commission pre-packaged 3-tier deliverables or publish custom project RFPs with verified ETB budgets.",
  },
  {
    number: "02",
    title: "Lock Funds in Non-Custodial Escrow",
    text: "Clients deposit project or milestone funds via Telebirr or CBE Birr. Capital is secured before code is committed.",
  },
  {
    number: "03",
    title: "Verify Deliverables & Mint SHA-256 Deed",
    text: "Review deliverables in the shared workspace. Releasing funds mints an immutable cryptographic Trust Deed.",
  },
];

const categories = [
  {
    name: "Cybersecurity & Auditing",
    description: "OWASP pentesting, NBE compliance, security hardening",
    icon: ShieldCheck,
    href: "/gigs?cat=Cybersecurity%20%26%20Auditing",
    badge: "C²SA Vetted",
  },
  {
    name: "Web & Full Stack Engineering",
    description: "Next.js 15, TypeScript, PostgreSQL, high-scale architectures",
    icon: Code2,
    href: "/gigs?cat=Web%20%26%20Full%20Stack",
    badge: "High Demand",
  },
  {
    name: "AI & Machine Learning",
    description: "LLM fine-tuning, Amharic NLP/OCR, vector pipelines",
    icon: Cpu,
    href: "/gigs?cat=AI%20%26%20Data%20Science",
    badge: "DeepTech",
  },
  {
    name: "Mobile & Telebirr Mini-Apps",
    description: "Flutter, React Native, Telebirr & CBE Birr SDK integrations",
    icon: Zap,
    href: "/gigs?cat=Mobile%20App%20Development",
    badge: "FinTech Ready",
  },
];

const METRICS = [
  { label: "ETB Escrow Settlement", value: "100%", sub: "Zero FX friction" },
  { label: "Dispute Rate", value: "< 0.2%", sub: "Guaranteed by arbitration" },
  { label: "Local Payment Rails", value: "Telebirr & CBE", sub: "Instant mobile clearing" },
  { label: "Trust Integrity", value: "SHA-256", sub: "Cryptographic Trust Deeds" },
];

export default function HomePage() {
  return (
    <div className="min-h-full space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-[linear-gradient(115deg,#fffbf5_0%,#fff_45%,#f4faf7_100%)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-56 left-[40%] h-[640px] w-[780px] rounded-full bg-[radial-gradient(circle,rgba(217,119,33,.12),transparent_68%)] blur-3xl" />
          <div className="absolute -bottom-72 right-[-8rem] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,.12),transparent_68%)] blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1.25fr_.75fr] lg:items-center lg:gap-16 lg:px-10 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1.5 text-xs font-bold text-brand-dark">
              <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse" />
              <span>MUDAYHUB FREELANCE MARKETPLACE &middot; ሙዳይ ፍሪላንስ</span>
            </div>

            <h1 className="mt-6 max-w-3xl text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] text-slate-900 sm:text-5xl lg:text-[3.6rem]">
              Ethiopian Tech Talent &amp; Digital Services.{" "}
              <span className="bg-gradient-to-r from-brand via-terracotta to-amber-500 bg-clip-text text-transparent">
                Secured by Escrow.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Commission vetted Ethiopian software engineers, designers, auditors, and digital creators.
              Zero prepayment risk. Funds are secured in milestone escrow until verified delivery.
            </p>

            {/* Live Search Form */}
            <form
              action="/gigs"
              method="GET"
              className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-900/5 sm:flex-row"
            >
              <label className="relative flex min-w-0 flex-1 items-center">
                <Search
                  aria-hidden="true"
                  className="absolute left-3.5 h-4 w-4 text-slate-400"
                />
                <input
                  name="q"
                  aria-label="Search services"
                  placeholder="What do you need built? (e.g. Telebirr SDK, Next.js, UI/UX)..."
                  className="h-12 w-full rounded-xl border-0 bg-transparent pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand/40"
                />
              </label>
              <label className="sr-only" htmlFor="home-category">
                Service category
              </label>
              <select
                id="home-category"
                name="cat"
                defaultValue=""
                className="h-12 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-700 outline-none focus:border-brand/50 sm:max-w-52"
              >
                <option value="">All Categories</option>
                {GIG_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn-primary h-12 !rounded-xl !px-6 text-sm font-bold shadow-ochre"
              >
                Search Services
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="font-bold text-slate-700">Popular:</span>
              {[
                ["Cyber Pentest", "Cybersecurity & Auditing"],
                ["Full-Stack Web", "Web & Full Stack"],
                ["Telebirr Apps", "Mobile App Development"],
                ["Brand & Ge'ez Design", "UI/UX & Product Design"],
              ].map(([label, category]) => (
                <Link
                  key={label}
                  href={`/gigs?cat=${encodeURIComponent(category)}`}
                  className="font-medium text-slate-600 transition hover:text-[#C8102E]"
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="btn-c2sa !rounded-xl !px-6 !py-3.5 text-sm font-bold shadow-ochre inline-flex items-center gap-2"
              >
                <span>Join C²SA Freelance Grid</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="btn-secondary !rounded-xl !px-5 !py-3.5 text-sm font-bold"
              >
                <span>How Escrow Works</span>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                C²SA Vetted Specialists
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-emerald-600" />
                Programmatic Milestone Escrow
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                SHA-256 Trust Deeds
              </span>
            </div>
          </div>

          {/* Quick Action Matrix Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#C8102E]">
                  Grid Operations
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Select Engagement Mode
                </h2>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-[#C8102E]">
                <Sparkles aria-hidden="true" className="h-5 w-5" />
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              <Link href="/gigs" className="group flex items-center gap-4 py-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-brand group-hover:bg-[#C8102E] group-hover:text-white transition">
                  <Search aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-900 group-hover:text-[#C8102E] transition text-sm">
                    Ready-to-Order Service Packages
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Pre-packaged 3-tier services with fixed pricing and turnaround.
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#C8102E]" />
              </Link>

              <Link href="/jobs" className="group flex items-center gap-4 py-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-900 group-hover:text-emerald-700 transition text-sm">
                    Open Project RFPs &amp; Bids
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Review client specifications and submit tailored milestone pitches.
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
              </Link>

              <Link href="/jobs/new" className="group flex items-center gap-4 py-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-[#C8102E] group-hover:bg-[#C8102E] group-hover:text-white transition">
                  <CircleDollarSign aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-900 group-hover:text-[#C8102E] transition text-sm">
                    Post Custom Engineering RFP
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Define custom requirements and hire vetted Ethiopian talent.
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#C8102E]" />
              </Link>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 flex items-center gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Backed by Telebirr &amp; CBE Birr programmatic escrow verification.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Grid Metrics Ticker */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((m, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1 text-center sm:text-left"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {m.label}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {m.value}
              </p>
              <p className="text-xs text-slate-500 font-medium">{m.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#C8102E]">
              Core Capabilities
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Vetted Engineering Specializations
            </h2>
          </div>
          <Link
            href="/gigs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C8102E] hover:text-[#A50D25]"
          >
            <span>Explore All Ready Services</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ name, description, icon: Icon, href, badge }) => (
            <Link
              key={name}
              href={href}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#C8102E]/40 hover:shadow-lg relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#C8102E] transition group-hover:bg-[#C8102E] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                  {badge}
                </span>
              </div>
              <h3 className="mt-5 font-bold text-slate-900 group-hover:text-[#C8102E] transition text-base">
                {name}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                {description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#C8102E]">
                View Offerings{" "}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Interactive Category Pricing Tabs */}
      <section className="border-y border-slate-200 bg-slate-50/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#C8102E]">
              Transparent ETB Scopes
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Inspect Scope, Turnaround &amp; Pricing
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Interactive category blueprints show typical sprint duration, deliverable checklists, and starting budgets.
            </p>
          </div>
          <HomeCategoryTabs />
        </div>
      </section>

      {/* Embedded Live Interactive Escrow Simulator */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <EscrowCalculator />
      </section>

      {/* Workflow & Protocol Steps */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-[#C8102E]">
            Protocol Mechanics
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            A Better Way to Commission Software
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Clear expectations protect both employers and independent engineering talent.
          </p>
        </div>

        <div className="grid gap-6 border-t border-slate-200 pt-8 sm:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <span className="font-mono text-sm font-black text-[#C8102E]">
                {step.number}
              </span>
              <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
              <p className="text-xs leading-relaxed text-slate-600">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Value Proportions Split Banner */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:px-8">
        <div className="rounded-3xl bg-[#1A222D] p-8 sm:p-10 text-white shadow-xl space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">
            FOR INDEPENDENT ENGINEERS &amp; CREATORS
          </p>
          <h2 className="text-2xl sm:text-3xl font-black">
            Build with guaranteed payment. Zero client ghosting.
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
            Never start work on unverified promises. With C²SA INTEL Escrow, funds are confirmed
            in non-custodial custody before you write a single line of code. Deliver quality work,
            get rated, and build your verifiable SHA-256 career record.
          </p>
          <div className="pt-4">
            <Link
              href="/register"
              className="btn-c2sa !py-3 !px-6 !text-xs font-bold shadow-ochre inline-flex items-center gap-2"
            >
              <span>Publish Your Services</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 sm:p-10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 font-mono">
              FOR ENTERPRISES &amp; SMES
            </p>
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-950">
            Vetted talent. Zero deliverable hostage risk.
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-emerald-900">
            <p className="flex gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>Full deliverable inspection before milestone release authorization.</span>
            </p>
            <p className="flex gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>Access to certified cybersecurity pentesting and cloud specialists.</span>
            </p>
            <p className="flex gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>Neutral 3-way split arbitration guarantees fair resolution.</span>
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/jobs/new"
              className="btn-primary !py-3 !px-6 !text-xs font-bold inline-flex items-center gap-2"
            >
              <span>Post Project Brief</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Corporate Dispatch & Contact Bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#C8102E]">
              <Mail className="h-4 w-4" />
              <span>ENTERPRISE ARCHITECTURE &amp; SECURITY SUPPORT</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Need Direct Custom Enterprise Engineering?
            </h3>
            <p className="text-xs text-slate-500">
              Contact the C²SA INTEL corporate dispatch team directly for institutional SLAs and sovereign infrastructure projects.
            </p>
          </div>
          <a
            href="mailto:contact.ccsa.intel@gmail.com"
            className="btn-c2sa !py-3 !px-6 text-xs font-bold shrink-0 font-mono"
          >
            contact.ccsa.intel@gmail.com
          </a>
        </div>
      </section>
    </div>
  );
}
