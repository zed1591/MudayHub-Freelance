"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Send, ShieldAlert, Wifi, WifiOff } from "lucide-react";
import type { EscrowStatus, Message } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { isDemoMode } from "@/lib/demo/mode";

interface Props {
  contractId: string;
  userId: string;
  escrowStatus: EscrowStatus;
}

export function ContractChat({ contractId, userId, escrowStatus }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [redactionActive, setRedactionActive] = useState(escrowStatus === "awaiting_deposit");
  const [hint, setHint] = useState("");
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof import("@supabase/supabase-js").createClient>["channel"] extends (...args: unknown[]) => infer R ? R : never>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages?contractId=${contractId}`);
    const data = await res.json();
    if (res.ok) {
      setMessages(data.messages || []);
      if (typeof data.redactionActive === "boolean") {
        setRedactionActive(data.redactionActive);
      }
    }
  }, [contractId]);

  // Scroll only the chat container to bottom without scrolling the whole page window
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    void load();

    // In demo mode (no Supabase), fall back to a short polling interval
    if (isDemoMode()) {
      const t = setInterval(() => void load(), 4_000);
      return () => clearInterval(t);
    }

    // Production: use Supabase Realtime for zero-latency delivery
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const channel = supabase
          .channel(`contract-chat:${contractId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `contract_id=eq.${contractId}`,
            },
            (payload) => {
              setMessages((prev) => {
                const msg = payload.new as Message;
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
            }
          )
          .subscribe((status) => {
            setRealtimeConnected(status === "SUBSCRIBED");
          });

        // Store ref so we can remove it on unmount
        // @ts-expect-error channel shape is opaque but this is correct
        channelRef.current = channel;

        cleanup = () => {
          void supabase.removeChannel(channel);
        };
      } catch {
        // Supabase not configured — fall back to polling
        const t = setInterval(() => void load(), 4_000);
        cleanup = () => clearInterval(t);
      }
    })();

    return () => cleanup?.();
  }, [contractId, load]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId, body }),
    });
    const data = await res.json();
    if (res.ok) {
      // In demo mode Realtime isn't available — append optimistically
      if (isDemoMode()) {
        setMessages((m) => [...m, data.message]);
      }
      setBody("");
      if (data.redacted) {
        setHint("Contact details were redacted until escrow is funded.");
      } else {
        setHint("");
      }
    }
  }

  return (
    <div className="card-surface p-6 rounded-3xl border border-slate-200/90 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>In-Contract Secure Communication</span>
        </h3>
        <div className="flex items-center gap-2">
          {!isDemoMode() && (
            <span
              title={realtimeConnected ? "Live — WebSocket connected" : "Connecting…"}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                realtimeConnected
                  ? "border-emerald-500/30 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-500"
              }`}
            >
              {realtimeConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {realtimeConnected ? "Live" : "Connecting"}
            </span>
          )}
          {redactionActive && (
            <span className="badge-brand flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              <span>Anti-Circumvention Active</span>
            </span>
          )}
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="max-h-72 space-y-2.5 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
      >
        {messages.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-6">
            No messages yet. Chat and exchange requirements securely here.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl px-4 py-2.5 text-xs ${
              m.sender_id === userId
                ? "ml-8 bg-brand text-white shadow-sm"
                : "mr-8 bg-white border border-slate-200 text-slate-800 shadow-sm"
            }`}
          >
            <p className="leading-relaxed">{m.body}</p>
            <p className={`mt-1 text-[10px] font-mono ${
              m.sender_id === userId ? "text-white/80" : "text-slate-400"
            }`}>
              {relativeTime(m.created_at)}
            </p>
          </div>
        ))}
      </div>

      {hint && <p className="text-xs text-brand-dark font-medium">{hint}</p>}

      <form onSubmit={send} className="flex gap-2">
        <input
          className="input-field text-xs"
          placeholder={
            redactionActive
              ? "Phones & @handles are filtered until escrow is funded…"
              : "Write a secure message…"
          }
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary shrink-0 !py-2.5 !px-5 shadow-ochre font-bold flex items-center gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
