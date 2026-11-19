"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Briefcase,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useSession } from "./SessionProvider";
import { useLanguage } from "./LanguageProvider";
import { LanguageSelector } from "./LanguageSelector";
import { cn } from "@/lib/utils";

interface NavLinkItem {
  href: string;
  label: string;
  icon: typeof FileText;
}

interface NavCluster {
  title: string;
  links: NavLinkItem[];
}

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const { user, logout, unreadCount } = useSession();
  const { language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    if (onNavigate) onNavigate();
    router.push("/");
  }

  // Exactly 3 canonical roles
  const currentRole = user?.role === "admin" ? "admin" : user?.role === "freelancer" ? "freelancer" : "client";

  // Role-clustered navigations
  const getNavClusters = (): NavCluster[] => {
    if (!user) {
      return [
        {
          title: "Marketplace",
          links: [
            { href: "/gigs", label: "Services", icon: Sparkles },
            { href: "/jobs", label: "Projects", icon: Briefcase },
            { href: "/talent", label: "Specialists", icon: Users },
          ],
        },
        {
          title: "Platform",
          links: [
            { href: "/how-it-works", label: "How It Works", icon: Wallet },
            { href: "/escrow", label: "Payment Protection", icon: ShieldCheck },
            { href: "/verify", label: "Verify Trust Deeds", icon: ShieldCheck },
          ],
        },
      ];
    }

    if (currentRole === "admin") {
      return [
        { title: "Workspace", links: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
        {
          title: "System Administration",
          links: [
            { href: "/admin/disputes", label: "Dispute Arbitration", icon: Scale },
            { href: "/contracts", label: "All Contracts", icon: FileCheck2 },
          ],
        },
        {
          title: "Platform Governance",
          links: [
            { href: "/escrow", label: "Payment status", icon: ShieldCheck },
            { href: "/verify", label: "Verify Trust Deeds", icon: ShieldCheck },
            { href: "/how-it-works", label: "Operational Rules", icon: Wallet },
          ],
        },
      ];
    }

    if (currentRole === "freelancer") {
      return [
        {
          title: "Workspace",
          links: [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/onboarding", label: "Skills & Feed", icon: Sparkles },
          ],
        },
        {
          title: "Opportunities",
          links: [
            { href: "/jobs", label: "Browse Project RFPs", icon: Briefcase },
            { href: "/proposals", label: "My Proposals", icon: FileText },
          ],
        },
        {
          title: "Freelance Workspace",
          links: [
            { href: "/contracts", label: "Active Contracts", icon: FileCheck2 },
          ],
        },
        {
          title: "Platform",
          links: [
            { href: "/gigs", label: "Services Catalog", icon: Sparkles },
            { href: "/escrow", label: "Payment status", icon: ShieldCheck },
            { href: "/verify", label: "Verify Trust Deeds", icon: ShieldCheck },
            { href: "/how-it-works", label: "How It Works", icon: Wallet },
          ],
        },
      ];
    }

    // Default: Client role
    return [
      {
        title: "Workspace",
        links: [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/onboarding", label: "Hiring Preferences", icon: Sparkles },
        ],
      },
      {
        title: "Find Talent & Services",
        links: [
          { href: "/talent", label: "Hire Specialists", icon: Users },
          { href: "/gigs", label: "Ready Service Packages", icon: Sparkles },
        ],
      },
      {
        title: "My Projects & Hiring",
        links: [
          { href: "/jobs/new", label: "Post a Project RFP", icon: Plus },
          { href: "/jobs?mine=true", label: "My Project Postings", icon: Briefcase },
          { href: "/proposals", label: "Proposals Received", icon: FileText },
          { href: "/contracts", label: "Active Contracts", icon: FileCheck2 },
        ],
      },
      {
        title: "Marketplace & Governance",
        links: [
          { href: "/jobs", label: "All Marketplace RFPs", icon: Briefcase },
          { href: "/escrow", label: "Payment status", icon: ShieldCheck },
          { href: "/verify", label: "Verify Trust Deeds", icon: ShieldCheck },
          { href: "/how-it-works", label: "How It Works", icon: Wallet },
        ],
      },
    ];
  };

  const navClusters = getNavClusters();

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col justify-between overflow-y-auto border-r border-slate-200/80 bg-white px-4 py-5 text-slate-800 scrollbar-thin scrollbar-thumb-slate-200",
        className
      )}
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <Link
          href="/"
          onClick={onNavigate}
          className="group flex items-center gap-3 px-1 transition"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand/30 bg-brand/10 p-1 shadow-glow transition group-hover:scale-105">
            <Image
              src="/logo-emblem.png"
              alt="MudayHub"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-brand transition">
                Muday<span className="text-brand">Hub</span>
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 font-mono tracking-wider uppercase">
              {language === "am" ? "የሙዳይ ፍሪላንስ" : "FREELANCE WORKSPACE"}
            </p>
          </div>
        </Link>

        {/* Primary Role Action Button (Authenticated Users) */}
        {user && (
          <div>
            {currentRole === "client" && (
              <Link
                href="/jobs/new"
                onClick={onNavigate}
                className="btn-primary !py-2.5 !text-xs w-full flex items-center justify-center gap-2 font-bold shadow-ochre"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Post Project RFP</span>
              </Link>
            )}
            {currentRole === "freelancer" && (
              <Link
                href="/gigs/new"
                onClick={onNavigate}
                className="btn-primary !py-2.5 !text-xs w-full flex items-center justify-center gap-2 font-bold shadow-ochre"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Offer a Service</span>
              </Link>
            )}
            {currentRole === "admin" && (
              <Link
                href="/admin/disputes"
                onClick={onNavigate}
                className="btn-primary !py-2.5 !text-xs w-full flex items-center justify-center gap-2 font-bold shadow-ochre"
              >
                <Scale className="h-4 w-4 shrink-0" />
                <span>Arbitration Panel</span>
              </Link>
            )}
          </div>
        )}

        {/* Clean, Clustered Navigation List */}
        <nav className="space-y-5">
          {navClusters.map((cluster) => (
            <div key={cluster.title} className="space-y-1">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {cluster.title}
              </p>

              <div className="space-y-0.5">
                {cluster.links.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href + "/"));
                  const Icon = link.icon;

                  return (
                    <div key={link.href} className="space-y-0.5">
                      <Link
                        href={link.href}
                        onClick={onNavigate}
                        className={cn(
                          "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150",
                          active
                            ? "bg-brand/10 text-brand-dark border border-brand/20 font-bold shadow-sm"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              "h-4 w-4 transition",
                              active ? "text-brand" : "text-slate-400 group-hover:text-slate-700"
                            )}
                          />
                          <span>{link.label}</span>
                        </div>
                        {active && (
                          <div className="h-1.5 w-1.5 rounded-full bg-brand" />
                        )}
                      </Link>

                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Clean Bottom Session Profile & Language Selector */}
      <div className="pt-3 border-t border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {language === "am" ? "ቋንቋ ይምረጡ" : "Language"}
          </span>
          <LanguageSelector />
        </div>
        {user ? (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200 shadow-sm">
            <Link
              href={`/profiles/${user.id}`}
              onClick={onNavigate}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-black text-white">
                {user.full_name?.slice(0, 2).toUpperCase() || "ME"}
              </div>
              <div className="truncate text-left">
                <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                  {user.full_name || "User"}
                </p>
                <p className="truncate text-[10px] text-brand-light font-medium capitalize">
                  {currentRole === "admin" ? "SystemAdmin" : currentRole === "freelancer" ? "Freelance" : "Client"}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-1 shrink-0">
              <Link
                href="/notifications"
                onClick={onNavigate}
                className="relative rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-900"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute 0 top-0 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-brand px-0.5 text-[8px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={onNavigate}
              className="btn-secondary !py-2.5 !text-xs text-center font-semibold"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={onNavigate}
              className="btn-primary !py-2.5 !text-xs text-center font-bold shadow-ochre"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
