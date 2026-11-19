import { isDemoMode } from "@/lib/demo/mode";
import { createAdminClient } from "@/lib/supabase/admin";

export type SecurityEventType =
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.register.success"
  | "auth.register.failure"
  | "auth.logout"
  | "auth.password_reset.requested"
  | "escrow.checkout.created"
  | "escrow.webhook.verified"
  | "escrow.webhook.invalid_signature"
  | "escrow.webhook.amount_mismatch"
  | "escrow.work.submitted"
  | "escrow.funds.released"
  | "escrow.milestone.released"
  | "escrow.dispute.opened"
  | "admin.dispute.review_started"
  | "admin.dispute.resolved"
  | "contract.worklog.created"
  | "contract.worklog.reviewed"
  | "storage.file_uploaded"
  | "storage.file_downloaded"
  | "storage.upload.forbidden_attempt"
  | "storage.download.forbidden_attempt"
  | "security.rate_limit_exceeded"
  | "security.access_denied"
  | "security.csrf_blocked"
  | "security.input_validation_failed";

interface RecordEventParams {
  actorId?: string | null;
  eventType: SecurityEventType;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
}

const REDACTED_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "key",
  "private_key",
  "card",
  "cvv",
]);

function sanitizeMetadata(raw: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (REDACTED_KEYS.has(k.toLowerCase())) {
      clean[k] = "[REDACTED]";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      clean[k] = sanitizeMetadata(v as Record<string, unknown>);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

/**
 * Security audit logger adhering to Security by Design and Defense in Depth.
 * In production, writes to the append-only `security_events` Postgres table (migration 006).
 * Secrets and sensitive payment tokens are strictly scrubbed prior to writing.
 */
export async function recordSecurityEvent({
  actorId,
  eventType,
  requestId,
  metadata = {},
}: RecordEventParams): Promise<void> {
  const sanitized = sanitizeMetadata(metadata);

  if (isDemoMode()) {
    // Demo mode: structured audit log to stdout for observation
    if (process.env.NODE_ENV !== "test") {
      console.info(
        JSON.stringify({
          level: "AUDIT",
          timestamp: new Date().toISOString(),
          actorId: actorId || null,
          eventType,
          requestId: requestId || null,
          metadata: sanitized,
        })
      );
    }
    return;
  }

  try {
    const admin = createAdminClient();
    await admin.from("security_events").insert({
      actor_id: actorId || null,
      event_type: eventType,
      request_id: requestId || null,
      metadata: sanitized,
    });
  } catch (err) {
    // Audit write failures are logged to stderr without disrupting user workflow
    console.error("[SECURITY AUDIT WRITE FAILURE]", eventType, err);
  }
}
