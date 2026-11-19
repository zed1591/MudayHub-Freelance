"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { LanguageSelector } from "./LanguageSelector";

export function Footer() {
  const { language, t } = useLanguage();

  return (
    <footer className="mt-12 border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 items-start">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-brand/30 bg-brand/10 p-1">
                <Image
                  src="/logo-emblem.png"
                  alt="MudayHub"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="text-base font-black tracking-tight text-slate-900">
                Muday<span className="text-brand">Hub</span>
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono uppercase">
                {language === "am" ? "የሙዳይ ፍሪላንስ" : "Freelance"}
              </span>
            </Link>

            <p className="max-w-md text-xs leading-relaxed text-slate-500">
              {t("footerTagline")}
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-0.5 text-[11px] font-semibold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t("escrowProtected")}</span>
            </div>
          </div>

          {/* Marketplace Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {language === "am" ? "የገበያ አገልግሎቶች" : "Marketplace"}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <Link href="/gigs" className="transition hover:text-brand">
                  {t("services")}
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="transition hover:text-brand">
                  {t("rfps")}
                </Link>
              </li>
              <li>
                <Link href="/talent" className="transition hover:text-brand">
                  {t("talent")}
                </Link>
              </li>
              <li>
                <Link href="/jobs/new" className="transition hover:text-brand">
                  {t("postProject")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Safety Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {language === "am" ? "ደህንነት እና ዋስትና" : "Trust & Governance"}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <Link href="/how-it-works" className="transition hover:text-brand">
                  {t("howItWorks")}
                </Link>
              </li>
              <li>
                <Link href="/escrow" className="transition hover:text-brand">
                  {t("escrow")}
                </Link>
              </li>
              <li>
                <Link href="/verify" className="transition hover:text-brand">
                  {language === "am" ? "የክፍያ ሰነድ ማረጋገጫ" : "Verify Trust Deeds"}
                </Link>
              </li>
              <li>
                <Link href="/admin/disputes" className="transition hover:text-brand">
                  {language === "am" ? "የሽምግልና ማዕከል" : "Dispute Resolution"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-[11px] text-slate-400 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} MudayHub. {t("copyright")}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Link href="/how-it-works" className="hover:text-slate-700 transition">
                {language === "am" ? "ደንቦች" : "Protocol Rules"}
              </Link>
              <span>&middot;</span>
              <Link href="/escrow" className="hover:text-slate-700 transition">
                {language === "am" ? "ቴሌብር" : "Telebirr Settlement"}
              </Link>
              <span>&middot;</span>
              <Link href="/verify" className="hover:text-slate-700 transition">
                SHA-256
              </Link>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </div>
    </footer>
  );
}
