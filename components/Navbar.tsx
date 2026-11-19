"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Menu,
  ShieldCheck,
  X,
  Compass,
  LayoutDashboard,
} from "lucide-react";
import { useSession } from "./SessionProvider";
import { Sidebar } from "./Sidebar";
import { useLanguage } from "./LanguageProvider";
import { LanguageSelector } from "./LanguageSelector";

interface NavbarProps {
  isWorkspace?: boolean;
}

export function Navbar({ isWorkspace = false }: NavbarProps) {
  const { user, unreadCount } = useSession();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  function getPageDetails() {
    if (pathname === "/") return { section: "Marketplace", title: "Home" };
    if (pathname.startsWith("/gigs/new")) return { section: "Services", title: "Publish Service" };
    if (pathname.startsWith("/gigs/")) return { section: "Services", title: "Service Details" };
    if (pathname === "/gigs") return { section: "Services", title: "Catalog & Packages" };
    if (pathname.startsWith("/jobs/new")) return { section: "Projects", title: "Post Project RFP" };
    if (pathname.startsWith("/jobs/")) return { section: "Projects", title: "Project RFP" };
    if (pathname === "/jobs") return { section: "Projects", title: "Browse RFPs" };
    if (pathname === "/talent") return { section: "Specialists", title: "Specialist Directory" };
    if (pathname.startsWith("/contracts/")) return { section: "Workspace", title: "Contract Workspace" };
    if (pathname === "/contracts") return { section: "Workspace", title: "Contracts" };
    if (pathname === "/proposals") return { section: "Submitted Bids", title: "My Submitted Bids" };
    if (pathname === "/dashboard") return { section: "Account", title: "Dashboard & Management" };
    if (pathname === "/escrow") return { section: "Payments", title: "Payment Status" };
    if (pathname === "/how-it-works") return { section: "Protocol", title: "How Muday Works" };
    if (pathname.startsWith("/admin")) return { section: "Arbitration", title: "Dispute Center" };
    if (pathname.startsWith("/profiles/")) return { section: "Specialist", title: "Public Profile" };
    if (pathname === "/login") return { section: "Auth", title: "Sign In" };
    if (pathname === "/register") return { section: "Auth", title: "Create Account" };
    return { section: "Platform", title: "MudayHub" };
  }

  const { section, title } = getPageDetails();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Mobile Hamburger & Logo (Always visible on mobile) */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-brand/30 bg-brand/10 p-1">
                <Image
                  src="/logo-emblem.png"
                  alt="MudayHub"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-black text-slate-900 tracking-tight">
                Muday<span className="text-brand">Hub</span>
              </span>
            </Link>
          </div>

          {/* Desktop Left: Public Logo OR Workspace Breadcrumbs */}
          {!isWorkspace ? (
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-brand/30 bg-brand/10 p-1">
                  <Image
                    src="/logo-emblem.png"
                    alt="MudayHub"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black text-slate-900 tracking-tight leading-none">
                    Muday<span className="text-brand">Hub</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Freelance
                  </span>
                </div>
              </Link>

              {/* Public Marketplace Navigation Links */}
              <nav className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-700">
                <Link
                  href="/gigs"
                  className={`px-3 py-1.5 rounded-xl transition hover:bg-slate-100 hover:text-slate-900 ${
                    pathname.startsWith("/gigs") ? "bg-slate-100 text-slate-900 font-extrabold" : ""
                  }`}
                >
                  {t("services")}
                </Link>
                <Link
                  href="/jobs"
                  className={`px-3 py-1.5 rounded-xl transition hover:bg-slate-100 hover:text-slate-900 ${
                    pathname.startsWith("/jobs") ? "bg-slate-100 text-slate-900 font-extrabold" : ""
                  }`}
                >
                  {t("rfps")}
                </Link>
                <Link
                  href="/talent"
                  className={`px-3 py-1.5 rounded-xl transition hover:bg-slate-100 hover:text-slate-900 ${
                    pathname.startsWith("/talent") ? "bg-slate-100 text-slate-900 font-extrabold" : ""
                  }`}
                >
                  {t("talent")}
                </Link>
                <Link
                  href="/escrow"
                  className={`px-3 py-1.5 rounded-xl transition hover:bg-slate-100 hover:text-slate-900 ${
                    pathname === "/escrow" ? "bg-slate-100 text-slate-900 font-extrabold" : ""
                  }`}
                >
                  {t("escrow")}
                </Link>
                <Link
                  href="/how-it-works"
                  className={`px-3 py-1.5 rounded-xl transition hover:bg-slate-100 hover:text-slate-900 ${
                    pathname === "/how-it-works" ? "bg-slate-100 text-slate-900 font-extrabold" : ""
                  }`}
                >
                  {t("howItWorks")}
                </Link>
              </nav>
            </div>
          ) : (
            /* Workspace Breadcrumbs on Desktop */
            <div className="hidden md:flex items-center gap-2.5 text-xs font-semibold">
              <span className="text-slate-500 font-bold">MudayHub</span>
              <span className="text-slate-300">/</span>
              <span className="text-brand font-medium">{section}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-bold">{title}</span>
            </div>
          )}

          {/* Desktop Right: Public CTAs OR Workspace Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            <LanguageSelector />
            {!isWorkspace ? (
              user ? (
                <>
                  <Link
                    href="/how-it-works"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-brand transition font-medium mr-1"
                  >
                    <Compass className="h-3.5 w-3.5 text-brand" />
                    <span>{t("protocol")}</span>
                  </Link>
                  <Link
                    href="/notifications"
                    className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                    title="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/dashboard"
                    className="btn-primary !py-2 !px-4 !text-xs font-bold inline-flex items-center gap-1.5 shadow-ochre"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span>{t("openDashboard")}</span>
                  </Link>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 mr-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{t("escrowProtected")}</span>
                  </div>
                  <Link
                    href="/login"
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                  >
                    {t("signIn")}
                  </Link>
                  <Link
                    href="/jobs/new"
                    className="btn-secondary !py-2 !px-3.5 !text-xs font-bold"
                  >
                    {t("postProject")}
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary !py-2 !px-4 !text-xs font-bold shadow-ochre"
                  >
                    {t("getStarted")}
                  </Link>
                </>
              )
            ) : (
              /* Workspace Desktop Right Controls */
              <div className="flex items-center gap-3">
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-brand transition font-medium"
                >
                  <Compass className="h-3.5 w-3.5 text-brand" />
                  <span>{t("howItWorks")}</span>
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{t("escrowActive")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Right: Quick Drawer Indicator & Language */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            {user && unreadCount > 0 && (
              <Link
                href="/notifications"
                className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              </Link>
            )}
            {user && (
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-xs font-black text-white"
                aria-label="Open workspace menu"
              >
                {user.full_name?.slice(0, 2).toUpperCase() || "U"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="relative z-50 flex h-full w-[85%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t("menu")}
              </span>
              <div className="flex items-center gap-2">
                <LanguageSelector />
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-xl border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
