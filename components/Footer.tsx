import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export function Footer() {
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
              <span className="text-xs font-bold text-slate-400 font-ethio">
                · ሙዳይ ፍሪላንስ
              </span>
            </Link>

            <p className="max-w-md text-xs leading-relaxed text-slate-500">
              Ethiopia&apos;s digital freelance marketplace. Connect with vetted software engineers, designers, and digital specialists with milestone escrow protection.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-0.5 text-[11px] font-semibold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Telebirr &amp; CBE Birr Escrow Protected</span>
            </div>
          </div>

          {/* Marketplace Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Marketplace
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <Link href="/gigs" className="transition hover:text-brand">
                  Services Catalog
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="transition hover:text-brand">
                  Project RFPs &amp; Bids
                </Link>
              </li>
              <li>
                <Link href="/talent" className="transition hover:text-brand">
                  Specialist Directory
                </Link>
              </li>
              <li>
                <Link href="/jobs/new" className="transition hover:text-brand">
                  Post a Project Brief
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Safety Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Trust &amp; Governance
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <Link href="/how-it-works" className="transition hover:text-brand">
                  How Escrow Works
                </Link>
              </li>
              <li>
                <Link href="/escrow" className="transition hover:text-brand">
                  Payment Protection
                </Link>
              </li>
              <li>
                <Link href="/verify" className="transition hover:text-brand">
                  Verify Trust Deeds
                </Link>
              </li>
              <li>
                <Link href="/admin/disputes" className="transition hover:text-brand">
                  Dispute Resolution
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-[11px] text-slate-400 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} MudayHub (ሙዳይ ፍሪላንስ). All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/how-it-works" className="hover:text-slate-700 transition">
              Protocol Rules
            </Link>
            <span>&middot;</span>
            <Link href="/escrow" className="hover:text-slate-700 transition">
              Telebirr Settlement
            </Link>
            <span>&middot;</span>
            <Link href="/verify" className="hover:text-slate-700 transition">
              SHA-256 Ledger
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
