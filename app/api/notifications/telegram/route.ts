import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/notifications/telegram";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore, writeStore } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import path from "path";
import fs from "fs";

export async function GET() {
  const isConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  return NextResponse.json({
    enabled: isConfigured,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || "MudayHubBot",
    mode: isConfigured ? "live" : "simulated",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is a test alert request
    if (body.type === "test") {
      const user = await getSessionUser();
      const res = await sendTelegramAlert({
        title: "Test Alert · ሙዳይ ፍሪላንስ",
        body: body.message || `Milestone alert test dispatched from MudayHub for user ${user?.email || "guest"}.`,
        link: "/dashboard",
        chatId: body.chatId,
      });
      return NextResponse.json(res);
    }

    // Telegram Bot Webhook handling (e.g. user sends /start <userId>)
    if (body.message?.text) {
      const text = String(body.message.text).trim();
      const chatId = body.message.chat?.id ? String(body.message.chat.id) : undefined;
      const username = body.message.from?.username ? String(body.message.from.username) : undefined;

      if (text.startsWith("/start") && chatId) {
        const parts = text.split(/\s+/);
        const linkedUserId = parts[1]?.trim();

        // Save last seen chatId locally for fallback
        try {
          const dir = path.join(process.cwd(), ".demo-data");
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(
            path.join(dir, "telegram_users.json"),
            JSON.stringify({ lastChatId: chatId, updatedAt: new Date().toISOString() })
          );
        } catch {
          // ignore local fallback save failure
        }

        // If a specific userId was passed via start parameter (e.g. t.me/bot?start=<userId>)
        if (linkedUserId) {
          if (isDemoMode()) {
            const store = readStore();
            const targetUser = store.users.find((u) => u.id === linkedUserId);
            if (targetUser) {
              targetUser.profile.telegram_chat_id = chatId;
              if (username) targetUser.profile.telegram_username = username;
              writeStore(store);
            }
          } else {
            try {
              const admin = createAdminClient();
              await admin
                .from("profiles")
                .update({
                  telegram_chat_id: chatId,
                  ...(username ? { telegram_username: username } : {}),
                })
                .eq("id", linkedUserId);
            } catch (dbErr) {
              console.warn("[Telegram Link Error]", dbErr);
            }
          }
        }

        await sendTelegramAlert({
          title: "Telegram Connected · ሙዳይ ፍሪላንስ",
          body: "Your Telegram account is now connected to MudayHub. You will receive real-time alerts when escrow is deposited, deliverables are submitted, and payouts are approved.",
          link: "/dashboard",
          chatId,
        });

        return NextResponse.json({ ok: true, linked: true, chatId });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process Telegram request" },
      { status: 400 }
    );
  }
}
