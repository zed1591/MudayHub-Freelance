import fs from "fs";
import path from "path";

/**
 * MudayHub Telegram Bot Notification Service
 * Connects The Muday Vault escrow lifecycle events to instant Telegram alerts.
 */

export interface TelegramAlertPayload {
  title: string;
  body: string;
  link?: string;
  chatId?: string;
  metadata?: Record<string, unknown>;
}

export interface TelegramSendResult {
  success: boolean;
  mode: "live" | "simulated";
  messageId?: number;
  error?: string;
}

/**
 * Format a rich Telegram message using Telegram HTML markup
 */
export function formatTelegramMessage(payload: TelegramAlertPayload): string {
  const parts: string[] = [
    `<b>ሙዳይ ፍሪላንስ · MudayHub Alert</b>`,
    ``,
    `<b>${escapeHtml(payload.title)}</b>`,
    escapeHtml(payload.body),
  ];

  if (payload.link) {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://mudayhub.et").replace(/\/$/, "");
    const fullUrl = payload.link.startsWith("http")
      ? payload.link
      : `${baseUrl}${payload.link.startsWith("/") ? "" : "/"}${payload.link}`;
    parts.push(``, `<a href="${escapeHtml(fullUrl)}">👉 View in MudayHub Workspace</a>`);
  }

  return parts.join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getLinkedChatId(chatId?: string): string | undefined {
  if (chatId) return chatId;
  if (process.env.TELEGRAM_DEFAULT_CHAT_ID) return process.env.TELEGRAM_DEFAULT_CHAT_ID;
  try {
    const file = path.join(process.cwd(), ".demo-data", "telegram_users.json");
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      return data.lastChatId;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

/**
 * Dispatch an alert to a user's Telegram chat
 */
export async function sendTelegramAlert(
  payload: TelegramAlertPayload
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = getLinkedChatId(payload.chatId);

  // When bot token or chat ID is not configured (e.g. local offline dev),
  // simulate successfully and record in console/audit
  if (!token || !targetChatId) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Telegram Sim] Target: ${targetChatId || "unlinked"} | ${payload.title} - ${payload.body}`
      );
    }
    return {
      success: true,
      mode: "simulated",
    };
  }

  try {
    const text = formatTelegramMessage(payload);
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.warn(`[Telegram API Error] ${data.description || res.statusText}`);
      return {
        success: false,
        mode: "live",
        error: data.description || "Telegram API rejected message",
      };
    }

    return {
      success: true,
      mode: "live",
      messageId: data.result?.message_id,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Network error";
    console.warn(`[Telegram Send Failed] ${error}`);
    return {
      success: false,
      mode: "live",
      error,
    };
  }
}
