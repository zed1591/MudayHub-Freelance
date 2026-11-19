"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  Globe,
  Layers,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

interface CategoryData {
  id: string;
  name: string;
  fullDesc: string;
  icon: typeof Code2;
  stack: string[];
  turnaround: string;
  startingPrice: string;
  deliverables: string[];
}

const CATEGORIES: CategoryData[] = [
  {
    id: "Web & Full Stack",
    name: "Web & Cloud Engineering",
    fullDesc:
      "Enterprise full-stack architectures, high-performance web applications, and resilient cloud backends built with scalable databases and automated domestic payment gateway integrations.",
    icon: Code2,
    stack: ["Next.js", "React", "Django", "FastAPI", "PostgreSQL", "Telebirr API"],
    turnaround: "3 - 7 Days",
    startingPrice: "4,500 ETB",
    deliverables: [
      "Production-ready codebase with clean architecture",
      "Automated Telebirr & CBE Birr checkout webhook integration",
      "Responsive, SEO-optimized UI with modern accessibility",
      "Full deployment to cloud host or local cloud VPS",
    ],
  },
  {
    id: "Mobile App Development",
    name: "Mobile App Development",
    fullDesc:
      "Cross-platform iOS and Android applications tailored for high-speed local performance, optimized for varying connectivity, and integrated with domestic SMS and biometric authentication.",
    icon: Smartphone,
    stack: ["Flutter", "React Native", "Android", "iOS", "Firebase"],
    turnaround: "5 - 14 Days",
    startingPrice: "7,000 ETB",
    deliverables: [
      "Cross-platform compiled APK / iOS binaries",
      "Telebirr in-app checkout SDK and local SMS auth",
      "Offline-first sync capabilities for low-bandwidth environments",
      "App Store & Google Play publishing readiness",
    ],
  },
  {
    id: "UI/UX & Product Design",
    name: "UI/UX & Brand Design",
    fullDesc:
      "Sophisticated digital product design honoring modern aesthetics. Combining global UI/UX standards, multi-lingual Ge'ez typography, and tactile design systems.",
    icon: Layers,
    stack: ["Figma", "Design Systems", "Prototyping", "Design Tokens"],
    turnaround: "2 - 5 Days",
    startingPrice: "3,000 ETB",
    deliverables: [
      "Interactive high-fidelity Figma prototypes with full component library",
      "Bilingual typography system with Ge'ez support",
      "Complete design tokens (colors, spacing, typography)",
      "Developer handoff documentation with ready-to-export SVG assets",
    ],
  },
  {
    id: "Cybersecurity & Auditing",
    name: "Cybersecurity & Code Audits",
    fullDesc:
      "Rigorous technical penetration testing, OWASP Top 10 vulnerability remediation, and architecture security audits designed to protect domestic fintech platforms from exploitation.",
    icon: ShieldCheck,
    stack: ["OWASP ZAP", "Burp Suite", "Static Analysis", "API Security"],
    turnaround: "3 - 7 Days",
    startingPrice: "8,500 ETB",
    deliverables: [
      "Comprehensive vulnerability assessment and pentest report",
      "Risk severity scoring with prioritized remediation guidance",
      "API authentication and rate-limiting audit",
      "Post-fix re-testing verification summary",
    ],
  },
  {
    id: "AI & Data Science",
    name: "Telegram Bots & Mini-Apps",
    fullDesc:
      "Transform high-volume Telegram traffic into profitable automated businesses. Build native Telegram Mini-Apps (TMA), customer service bots, and automated Telebirr payment webhooks.",
    icon: Bot,
    stack: ["Telegram Bot API", "Telegram Mini Apps", "Node.js", "Python"],
    turnaround: "2 - 5 Days",
    startingPrice: "2,800 ETB",
    deliverables: [
      "High-concurrency Telegram bot deployed on cloud server",
      "Native Telegram Mini-App UI powered by Next.js / React",
      "Automated payment confirmation and receipt delivery via Telebirr",
      "Admin broadcast console and user management commands",
    ],
  },
  {
    id: "Translation & Localization",
    name: "Language Translation & Localization",
    fullDesc:
      "Accurate cultural and technical localization of software interfaces, legal documentation, terms of service, and user manuals into major regional languages.",
    icon: Globe,
    stack: ["Amharic", "Afaan Oromoo", "Tigrinya", "Software i18n"],
    turnaround: "1 - 3 Days",
    startingPrice: "1,500 ETB",
    deliverables: [
      "Fully localized i18n JSON / PO string resource files",
      "Culturally nuanced technical and commercial translations",
      "Proofreading and linguistic QA by native domain specialists",
      "Glossary and style guide for ongoing consistency",
    ],
  },
];

export function HomeCategoryTabs() {
  const [selectedCat, setSelectedCat] = useState<CategoryData>(CATEGORIES[0]);

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-12 lg:gap-8 lg:p-5">
      <div className="flex flex-row overflow-x-auto gap-2 pb-2 lg:flex-col lg:space-y-1.5 lg:gap-0 lg:overflow-visible lg:pb-0 lg:col-span-4">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCat.id === cat.id;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat)}
              aria-pressed={isSelected}
              className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-150 shrink-0 min-w-[210px] lg:min-w-0 lg:w-full ${
                isSelected
                  ? "border-brand/30 bg-orange-50 text-brand-dark font-bold shadow-sm"
                  : "border-slate-200/60 lg:border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 transition ${
                    isSelected ? "text-brand" : "text-slate-400"
                  }`}
                />
                <span className="text-xs truncate">{cat.name}</span>
              </div>

              {isSelected && (
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-6 border-t border-slate-200 pt-6 lg:col-span-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-2xl font-extrabold tracking-tight text-slate-950">
            {selectedCat.name}
          </h3>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-brand-light font-bold">
              From {selectedCat.startingPrice}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700">
              {selectedCat.turnaround}
            </span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-600">
          {selectedCat.fullDesc}
        </p>

        {/* Deliverables List */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Standard Deliverables
          </p>
          <ul className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
            {selectedCat.deliverables.map((del) => (
              <li key={del} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{del}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          {selectedCat.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href={`/gigs?cat=${encodeURIComponent(selectedCat.id)}`}
            className="btn-primary !text-xs !py-3 !px-6 font-bold shadow-ochre inline-flex items-center gap-2"
          >
            <span>Browse {selectedCat.name}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
