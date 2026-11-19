"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { relativeTime } from "@/lib/utils";
import type { Notification } from "@/lib/types";

type FilterTab = "all" | "unread" | "escrow" | "worklogs" | "disputes";

export default function NotificationsPage() {
  const { user, loading, notifications, refreshNotifications, markAllRead } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    void refreshNotifications();
  }, [user, loading, router, refreshNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  async function handleMarkSingleRead(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      await refreshNotifications();
    } catch {
      // ignore
    }
  }

  async function handleDeleteSingle(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await refreshNotifications();
    } catch {
      // ignore
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    setBusy(true);
    try {
      await fetch("/api/notifications?all=true", { method: "DELETE" });
      await refreshNotifications();
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkAllAsRead() {
    setBusy(true);
    try {
      await markAllRead();
    } finally {
      setBusy(false);
    }
  }

  function getNotificationCategory(n: Notification): "dispute" | "escrow" | "worklog" | "general" {
    const text = `${n.title} ${n.body}`.toLowerCase();
    if (text.includes("dispute") || text.includes("arbitration") || text.includes("flagged") || text.includes("breach")) {
      return "dispute";
    }
    if (text.includes("milestone") || text.includes("funded") || text.includes("released") || text.includes("escrow") || text.includes("payout") || text.includes("contract")) {
      return "escrow";
    }
    if (text.includes("worklog") || text.includes("deliverable") || text.includes("submission") || text.includes("progress")) {
      return "worklog";
    }
    return "general";
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "unread") return !n.read;
      if (activeTab === "escrow") return getNotificationCategory(n) === "escrow";
      if (activeTab === "worklogs") return getNotificationCategory(n) === "worklog";
      if (activeTab === "disputes") return getNotificationCategory(n) === "dispute";
      return true;
    });
  }, [notifications, activeTab]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand-dark">
            <Bell className="h-3.5 w-3.5 text-brand" />
            <span>Activity Stream · MudayHub</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            Notifications &amp; Activity
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Escrow deposits, milestone completions, worklog checkpoints, and dispute alerts.
          </p>
        </div>

        {/* Global Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={handleMarkAllAsRead}
              className="btn-secondary !text-xs !py-2 !px-3 font-semibold inline-flex items-center gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={handleClearAll}
              className="btn-secondary !text-xs !py-2 !px-3 text-rose-600 hover:bg-rose-50 font-semibold inline-flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              <span>Clear feed</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all" as const, label: "All Activity", count: notifications.length },
            { id: "unread" as const, label: "Unread", count: unreadCount },
            {
              id: "escrow" as const,
              label: "Escrow & Milestones",
              count: notifications.filter((n) => getNotificationCategory(n) === "escrow").length,
            },
            {
              id: "worklogs" as const,
              label: "Worklogs",
              count: notifications.filter((n) => getNotificationCategory(n) === "worklog").length,
            },
            {
              id: "disputes" as const,
              label: "Disputes & Alerts",
              count: notifications.filter((n) => getNotificationCategory(n) === "dispute").length,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          Showing {filteredNotifications.length} items
        </span>
      </div>

      {/* Notifications List */}
      <div className="mt-6 space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="card-surface rounded-3xl p-12 text-center border border-slate-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Filter className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-900">No notifications match this filter</p>
            <p className="mt-1 text-xs text-slate-500">
              {activeTab === "unread"
                ? "You have no unread notifications. You're fully caught up!"
                : "No matching activity records found for this category."}
            </p>
            {activeTab !== "all" && (
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className="btn-secondary !text-xs !py-1.5 !px-3 font-semibold mt-4"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const category = getNotificationCategory(n);
            const isUnread = !n.read;

            return (
              <div
                key={n.id}
                className={`card-surface group relative flex items-start justify-between gap-4 p-5 rounded-2xl border transition-all duration-150 ${
                  isUnread
                    ? "border-brand/40 bg-orange-50/20 shadow-sm"
                    : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                {/* Category Icon */}
                <div className="shrink-0 mt-0.5">
                  {category === "dispute" ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  ) : category === "escrow" ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  ) : category === "worklog" ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <FileCode className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-brand-dark">
                      <Bell className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      {n.title}
                    </span>
                    {isUnread && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[9px] font-black uppercase text-white tracking-wider">
                        NEW
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      · {relativeTime(n.created_at)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {n.body}
                  </p>

                  {n.link && (
                    <div className="mt-2.5">
                      <Link
                        href={n.link}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                      >
                        <span>Open Workspace / Action</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Single Item Action Buttons */}
                <div className="flex items-center gap-1 shrink-0 self-start sm:self-center">
                  {isUnread && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkSingleRead(n.id, e)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSingle(n.id, e)}
                    title="Dismiss notification"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
