/**
 * MudayHub Transactional Email Dispatcher
 * Dispatches high-priority escrow lifecycle events, milestone approvals, and security alerts.
 * Uses Resend API in production or clean simulated fallback in dev/offline mode.
 */

export interface EmailDetailItem {
  label: string;
  value: string;
}

export interface TransactionalEmailPayload {
  to: string;
  subject: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  details?: EmailDetailItem[];
}

export interface EmailSendResult {
  success: boolean;
  mode: "live" | "simulated";
  messageId?: string;
  error?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatEmailHtml(payload: TransactionalEmailPayload): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://mudayhub.et").replace(/\/$/, "");
  const fullActionUrl = payload.actionUrl
    ? payload.actionUrl.startsWith("http")
      ? payload.actionUrl
      : `${baseUrl}${payload.actionUrl.startsWith("/") ? "" : "/"}${payload.actionUrl}`
    : null;

  const detailsHtml =
    payload.details && payload.details.length > 0
      ? `
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #121820; border: 1px solid #1E293B; border-radius: 6px; overflow: hidden;">
        <tbody>
          ${payload.details
            .map(
              (d) => `
            <tr style="border-bottom: 1px solid #1E293B;">
              <td style="padding: 12px 16px; font-family: monospace; font-size: 12px; color: #94A3B8; text-transform: uppercase; width: 40%;">${escapeHtml(
                d.label
              )}</td>
              <td style="padding: 12px 16px; font-family: monospace; font-size: 13px; font-weight: bold; color: #F8FAFC; text-align: right;">${escapeHtml(
                d.value
              )}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
      : "";

  const actionButtonHtml = fullActionUrl
    ? `
      <div style="margin: 32px 0 24px; text-align: center;">
        <a href="${escapeHtml(fullActionUrl)}" style="display: inline-block; background-color: #D97721; color: #FFFFFF; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 6px; letter-spacing: 0.05em; text-transform: uppercase; box-shadow: 0 4px 14px rgba(217, 119, 33, 0.4);">
          ${escapeHtml(payload.actionLabel || "View in Workspace")} &rarr;
        </a>
      </div>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(payload.subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F14; color: #E2E8F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0B0F14; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #0F141C; border: 1px solid #1E293B; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #080B0F; padding: 20px 24px; border-bottom: 2px solid #D97721;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td>
                    <div style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF;">
                      <span style="color: #D97721;">ሙዳይ</span> MUDAYHUB
                    </div>
                    <div style="font-family: monospace; font-size: 10px; color: #64748B; letter-spacing: 0.1em; text-transform: uppercase;">
                      C&sup2;SA INTEL &middot; ESCROW OS
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 3px 8px; border: 1px solid #334155; border-radius: 3px; font-family: monospace; font-size: 10px; font-weight: 700; color: #10B981; background-color: rgba(16, 185, 129, 0.1);">
                      VERIFIED ESCROW
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.01em;">
                ${escapeHtml(payload.title)}
              </h1>
              <p style="margin: 0 0 20px; font-size: 15px; color: #CBD5E1; line-height: 1.6;">
                ${escapeHtml(payload.body).replace(/\n/g, "<br>")}
              </p>

              ${detailsHtml}
              ${actionButtonHtml}

              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1E293B; font-size: 12px; color: #64748B;">
                <p style="margin: 0 0 8px;">
                  <strong>Security Note:</strong> MudayHub operations are protected by multi-signature escrow protocol. Never share verification codes or private credentials.
                </p>
                <p style="margin: 0;">
                  Verify cryptographic Trust Deeds anytime at <a href="${baseUrl}/verify" style="color: #D97721; text-decoration: none;">${baseUrl}/verify</a>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #080B0F; padding: 18px 24px; border-top: 1px solid #1E293B; text-align: center; font-size: 11px; color: #475569; font-family: monospace;">
              &copy; ${new Date().getFullYear()} MudayHub &middot; C&sup2;SA INTEL Freelance Security &middot; Addis Ababa, Ethiopia
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendTransactionalEmail(
  payload: TransactionalEmailPayload
): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "MudayHub Escrow <escrow@mudayhub.et>";

  // Offline / Dev mode simulation
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Email Sim] To: ${payload.to} | Subject: ${payload.subject} | Title: ${payload.title}`
      );
    }
    return {
      success: true,
      mode: "simulated",
    };
  }

  try {
    const html = formatEmailHtml(payload);
    const text = `${payload.title}\n\n${payload.body}\n\n${
      payload.actionUrl ? `Action Link: ${payload.actionUrl}\n\n` : ""
    }MudayHub Freelance Escrow OS · C²SA INTEL`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.to],
        subject: payload.subject,
        html,
        text,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data?.message || res.statusText || "Resend API error";
      console.warn(`[Email API Error] ${errorMsg}`);
      return {
        success: false,
        mode: "live",
        error: errorMsg,
      };
    }

    return {
      success: true,
      mode: "live",
      messageId: data?.id,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Network error";
    console.warn(`[Email Send Failed] ${error}`);
    return {
      success: false,
      mode: "live",
      error,
    };
  }
}
