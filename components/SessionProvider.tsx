"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, authApi } from "@/lib/api";
import { isDemoMode } from "@/lib/demo/mode";
import type { Notification, Profile } from "@/lib/types";

type SessionState = {
  user: Profile | null;
  email: string;
  loading: boolean;
  demoMode: boolean;
};

type SessionContextValue = SessionState & {
  setUser: (user: Profile | null, email?: string) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    user: null,
    email: "",
    loading: true,
    demoMode: isDemoMode(),
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Keep a ref to the Supabase Realtime channel so we can clean it up
  const realtimeCleanupRef = useRef<(() => void) | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { user, demoMode } = await authApi.me();
      setState({
        user: user?.profile ?? null,
        email: user?.email ?? "",
        loading: false,
        demoMode,
      });
      if (user) {
        try {
          const { notifications } = await api.get<{
            notifications: Notification[];
          }>("/api/notifications");
          setNotifications(notifications);
        } catch {
          /* ignore */
        }
      } else {
        setNotifications([]);
      }
    } catch {
      setState((s) => ({ ...s, user: null, email: "", loading: false }));
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const { notifications } = await api.get<{ notifications: Notification[] }>(
        "/api/notifications"
      );
      setNotifications(notifications);
    } catch {
      /* not signed in or transient */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch("/api/notifications", { all: true });
      await refreshNotifications();
    } catch {
      /* ignore */
    }
  }, [refreshNotifications]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    setState((s) => ({ ...s, user: null, email: "" }));
    setNotifications([]);
  }, []);

  const setUser = useCallback((user: Profile | null, email = "") => {
    setState((s) => ({ ...s, user, email }));
  }, []);

  // Subscribe to Supabase Realtime for instant notification delivery (production only).
  // Demo mode falls back to polling because there is no live Supabase instance.
  const subscribeRealtime = useCallback(
    async (userId: string) => {
      // Clean up any previous subscription first
      realtimeCleanupRef.current?.();
      realtimeCleanupRef.current = null;

      if (isDemoMode()) return;

      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const channel = supabase
          .channel(`notifications:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              setNotifications((prev) => [payload.new as Notification, ...prev]);
            }
          )
          .subscribe();

        realtimeCleanupRef.current = () => {
          void supabase.removeChannel(channel);
        };
      } catch {
        // Supabase not configured — fall back silently to polling below
      }
    },
    []
  );

  useEffect(() => {
    void refresh();

    // Always keep a slow background poll as a safety net (handles demo mode
    // and cases where the Realtime channel drops silently).
    const pollInterval = isDemoMode() ? 15_000 : 60_000;
    const t = setInterval(() => void refreshNotifications(), pollInterval);

    return () => {
      clearInterval(t);
      realtimeCleanupRef.current?.();
    };
  }, [refresh, refreshNotifications]);

  // Re-subscribe whenever the signed-in user changes
  useEffect(() => {
    if (state.user?.id) {
      void subscribeRealtime(state.user.id);
    } else {
      realtimeCleanupRef.current?.();
      realtimeCleanupRef.current = null;
    }
  }, [state.user?.id, subscribeRealtime]);

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      setUser,
      refresh,
      logout,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      refreshNotifications,
      markAllRead,
    }),
    [state, setUser, refresh, logout, notifications, refreshNotifications, markAllRead]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
