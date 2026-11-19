"use client";

/**
 * Thin client-side data layer. All auth + business logic lives in the
 * API routes under /api (cookie-based sessions, demo-mode fallback,
 * service-role writes). The browser just calls these and reads JSON.
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      (data as { error?: string })?.error || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ── Typed conveniences ─────────────────────────────────────────────
export const authApi = {
  me: () => api.get<{ user: import("@/lib/types").SessionUser | null; demoMode: boolean }>("/api/auth/me"),
  login: (email: string, password: string) =>
    api.post<{ user: unknown }>("/api/auth/login", { email, password }),
  register: (body: {
    email: string;
    password: string;
    full_name: string;
    role: "client" | "freelancer" | "admin";
    phone?: string;
  }) => api.post<{ user: unknown }>("/api/auth/register", body),
  logout: () => api.post<{ ok: boolean }>("/api/auth/logout"),
};

export const jobsApi = {
  list: (params?: { category?: string; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.q) qs.set("q", params.q);
    const s = qs.toString();
    return api.get<{ jobs: import("@/lib/types").Job[] }>(`/api/jobs${s ? `?${s}` : ""}`);
  },
  one: (id: string) =>
    api.get<{ job: import("@/lib/types").Job; proposals: import("@/lib/types").Proposal[] }>(
      `/api/jobs/${id}`
    ),
  create: (body: {
    title: string;
    description: string;
    category: string;
    budget_etb: number;
    skills?: string[];
  }) => api.post<{ job: import("@/lib/types").Job }>("/api/jobs", body),
};

export const proposalsApi = {
  mine: () =>
    api.get<{ proposals: import("@/lib/types").Proposal[] }>("/api/proposals"),
  create: (body: {
    job_id: string;
    bid_amount_etb: number;
    duration_days: number;
    cover_letter: string;
  }) => api.post<{ proposal: import("@/lib/types").Proposal }>("/api/proposals", body),
  accept: (id: string) =>
    api.post<{ contract: import("@/lib/types").Contract }>(`/api/proposals/${id}/accept`),
};

export const contractsApi = {
  mine: () => api.get<{ contracts: import("@/lib/types").Contract[] }>("/api/contracts"),
  one: (id: string) =>
    api.get<{
      contract: import("@/lib/types").Contract;
      disputes: import("@/lib/types").Dispute[];
      messages: import("@/lib/types").Message[];
    }>(`/api/contracts/${id}`),
};

export const escrowApi = {
  checkout: (contractId: string) =>
    api.post<{ session: { checkoutUrl: string; reference: string; provider: string } }>(
      "/api/escrow/checkout",
      { contractId }
    ),
  submitWork: (contractId: string, url: string) =>
    api.post<{ contract: import("@/lib/types").Contract }>("/api/escrow/submit-work", {
      contractId,
      work_submission_url: url,
    }),
  release: (contractId: string) =>
    api.post<{ contract: import("@/lib/types").Contract; payout: unknown }>("/api/escrow/release", {
      contractId,
    }),
  dispute: (contractId: string, reason: string, evidence_url?: string) =>
    api.post<{ dispute: import("@/lib/types").Dispute; contract: import("@/lib/types").Contract }>(
      "/api/escrow/dispute",
      { contractId, reason, evidence_url }
    ),
};

export const messagesApi = {
  list: (contractId: string) =>
    api.get<{ messages: import("@/lib/types").Message[]; redactionActive: boolean }>(
      `/api/messages?contractId=${encodeURIComponent(contractId)}`
    ),
  send: (contractId: string, body: string) =>
    api.post<{ message: import("@/lib/types").Message; redacted: boolean }>("/api/messages", {
      contractId,
      body,
    }),
};

export const notificationsApi = {
  list: () => api.get<{ notifications: import("@/lib/types").Notification[] }>("/api/notifications"),
  markAll: () => api.patch<{ ok: boolean }>("/api/notifications", { all: true }),
  mark: (ids: string[]) => api.patch<{ ok: boolean }>("/api/notifications", { ids }),
};

export const profileApi = {
  update: (body: {
    full_name?: string;
    bio?: string;
    skills?: string[];
    phone?: string;
    telebirr_number?: string;
  }) => api.patch<{ profile: import("@/lib/types").Profile }>("/api/profiles/me", body),
};

export const adminApi = {
  disputes: () => api.get<{ disputes: import("@/lib/types").Dispute[] }>("/api/admin/disputes"),
  resolveDispute: (body: {
    disputeId: string;
    status: "under_review" | "resolved";
    resolution_notes?: string;
    outcome?: "release" | "refund";
  }) => api.patch<{ dispute: import("@/lib/types").Dispute }>("/api/admin/disputes", body),
};
