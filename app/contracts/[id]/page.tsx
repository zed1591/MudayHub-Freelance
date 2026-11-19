"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Maximize2, Minimize2, Shield, ArrowLeft } from "lucide-react";
import { EscrowContractView } from "@/components/EscrowContractView";
import type { Contract, Dispute, Profile } from "@/lib/types";
import { isDemoMode } from "@/lib/demo/mode";

export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<
    (Contract & {
      jobs?: { title: string; category?: string };
      gigs?: { title: string; category?: string; cover_image?: string };
      client?: Pick<Profile, "full_name" | "phone">;
      freelancer?: Pick<Profile, "full_name" | "telebirr_number">;
    }) | null
  >(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [user, setUser] = useState<{ id: string; profile: Profile } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  const fetchContract = useCallback(async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/contracts/${id}`);
      if (r.ok) {
        const d = await r.json();
        if (d.contract) {
          setContract(d.contract);
          setDisputes(d.disputes || []);
        }
      }
    } catch {
      // Ignore background refresh errors
    }
  }, [id]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.push("/login");
        else setUser(d.user);
      })
      .catch(() => router.push("/login"));

    void fetchContract();
  }, [id, router, fetchContract]);

  // Realtime synchronization: Supabase realtime channel with demo-mode polling fallback
  useEffect(() => {
    if (!id) return;

    if (isDemoMode()) {
      const interval = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          void fetchContract();
        }
      }, 4_000);
      return () => clearInterval(interval);
    }

    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const channel = supabase
          .channel(`contract-room:${id}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "contracts", filter: `id=eq.${id}` },
            () => void fetchContract()
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "disputes", filter: `contract_id=eq.${id}` },
            () => void fetchContract()
          )
          .subscribe();

        cleanup = () => {
          void supabase.removeChannel(channel);
        };
      } catch {
        // Fallback polling if Supabase realtime is unavailable
        const interval = setInterval(() => void fetchContract(), 5_000);
        cleanup = () => clearInterval(interval);
      }
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, [id, fetchContract]);

  if (!contract || !user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center text-slate-400">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent mb-3" />
        <p className="font-mono text-xs tracking-wider uppercase text-slate-400">Loading secure escrow workspace…</p>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-300 ${isFullscreen ? "w-full max-w-[1720px] mx-auto px-3 sm:px-6 py-6" : "mx-auto max-w-6xl px-4 py-10"}`}>
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>

          <span className="text-slate-300">/</span>

          <span className="font-mono text-xs font-bold text-slate-800">
            ROOM-{contract.id.slice(0, 8).toUpperCase()}
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-50 text-emerald-800 text-[10px] font-bold font-mono">
            <Shield className="h-3 w-3 text-emerald-600" />
            MUDAY VAULT SECURE
          </span>
        </div>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold font-mono text-slate-700 transition shadow-sm"
          title={isFullscreen ? "Switch to standard container view" : "Switch to expansive full-screen workspace"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5 text-brand" />
              <span>Standard View</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5 text-brand" />
              <span>Fullscreen Mode</span>
            </>
          )}
        </button>
      </div>

      <EscrowContractView
        contract={contract}
        role={user.profile.role}
        userId={user.id}
        disputes={disputes}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />
    </div>
  );
}
