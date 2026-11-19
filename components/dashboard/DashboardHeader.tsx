"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Plus,
  RefreshCw,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Wallet,
  Smartphone,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { formatMemberSince } from "@/lib/utils";

interface Props {
  profile: Profile;
  isClient: boolean;
  isFreelancer: boolean;
  isAdmin?: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onRoleSwitch?: () => Promise<void>;
}

export function DashboardHeader({
  profile,
  isClient,
  isFreelancer,
  isAdmin,
  isFullScreen,
  onToggleFullScreen,
  onRoleSwitch,
}: Props) {
  const initials = profile.full_name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="card-surface relative overflow-hidden rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm bg-white">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-10 blur-3xl"
        style={{
          background: "radial-gradient(circle, #DF8A33, #BD5D38, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full opacity-10 blur-2xl"
        style={{
          background: "radial-gradient(circle, #10B981, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={56}
                height={56}
                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-brand/20 shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-terracotta text-xl font-black text-white shadow-sm ring-2 ring-brand/20 font-mono">
                {initials}
              </div>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
              title="Online & Verified"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {profile.full_name}
              </h1>
              {profile.is_verified && (
                <span title="Muday Vetted Specialist" className="flex items-center">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="badge-c2sa text-[10px]">
                {isClient ? "Enterprise Client" : "Muday Vetted Specialist"}
              </span>
              <span className="text-slate-300">·</span>
              {isFreelancer ? (
                <span className="font-mono text-amber-600 font-bold flex items-center gap-0.5">
                  <span>★</span>
                  <span>{profile.rating.toFixed(1)}</span>
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold inline-flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Escrow Verified</span>
                </span>
              )}
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-500 text-[11px]">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>Since {formatMemberSince(profile.created_at)}</span>
              </span>
            </div>

            {/* Payout & Showcase Strip */}
            <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
              {profile.telebirr_number ? (
                <span className="inline-flex items-center gap-1 font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Smartphone className="h-3 w-3 text-emerald-600" />
                  <span>Telebirr: {profile.telebirr_number}</span>
                </span>
              ) : isClient ? (
                <span className="inline-flex items-center gap-1 font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  <span>Direct Escrow Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Wallet className="h-3 w-3 text-amber-600" />
                  <span>Telebirr Pending</span>
                </span>
              )}

              <Link
                href={`/profiles/${profile.id}`}
                className="text-slate-600 hover:text-brand font-semibold inline-flex items-center gap-1 transition"
              >
                <span>Public Profile</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Tactical Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              className="btn-secondary !py-2 !px-3 !text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:border-brand/40"
              title={isFullScreen ? "Exit Fullscreen Workspace" : "Maximize Fullscreen Workspace"}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Normal View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>
          )}

          {onRoleSwitch && (
            <button
              type="button"
              onClick={onRoleSwitch}
              className="btn-secondary !py-2 !px-3 !text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:border-brand/40 hover:text-brand transition"
              title={`Switch workspace mode to ${isClient ? "Freelancer" : "Client"}`}
            >
              <RefreshCw className="h-3.5 w-3.5 text-brand" />
              <span className="hidden md:inline">Switch to </span>
              <span>{isClient ? "Specialist" : "Client"}</span>
            </button>
          )}

          {isAdmin ? (
            <>
              <Link
                href="/admin/disputes"
                className="btn-c2sa !py-2 !px-4 !text-xs font-bold flex items-center gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Dispute Center</span>
              </Link>
              <Link
                href="/jobs/new"
                className="btn-secondary !py-2 !px-3 !text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5 text-brand" />
                <span>Post RFP</span>
              </Link>
            </>
          ) : isClient ? (
            <Link
              href="/jobs/new"
              className="btn-c2sa !py-2 !px-4 !text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Post RFP</span>
            </Link>
          ) : (
            <Link
              href="/gigs/new"
              className="btn-c2sa !py-2 !px-4 !text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Publish Gig</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
