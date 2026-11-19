#!/usr/bin/env python3
"""
MudayHub Telegram Bot Polling Daemon
Listens for user interactions on @MudayHubBot and records linked chat IDs.
"""

import os
import sys
import time
import json
import urllib.request
import urllib.error

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "9061438846:AAEyVn33EkYGKMX7mAItjMHZUxwD3tBQTWo")
API_BASE = f"https://api.telegram.org/bot{TOKEN}"
DATA_DIR = os.path.join(os.getcwd(), ".demo-data")
USERS_FILE = os.path.join(DATA_DIR, "telegram_users.json")

os.makedirs(DATA_DIR, exist_ok=True)

def save_chat_id(chat_id, user_info=None):
    data = {}
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r") as f:
                data = json.load(f)
        except Exception:
            data = {}
    
    data["lastChatId"] = str(chat_id)
    if user_info:
        data[str(chat_id)] = user_info
    
    with open(USERS_FILE, "w") as f:
        json.dump(data, f, indent=2)
    print(f"[*] Saved active Telegram Chat ID: {chat_id}")

def send_reply(chat_id, text):
    url = f"{API_BASE}/sendMessage"
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[!] Error sending reply: {e}")
        return None

def main():
    print(f"[*] Starting MudayHub Telegram Bot listener for token {TOKEN[:10]}...")
    
    # Verify bot
    try:
        with urllib.request.urlopen(f"{API_BASE}/getMe") as r:
            me = json.loads(r.read().decode("utf-8"))
            print(f"[*] Bot connected: @{me['result']['username']} ({me['result']['first_name']})")
    except Exception as e:
        print(f"[!] Failed to connect to Telegram: {e}")
        sys.exit(1)

    offset = None
    while True:
        try:
            url = f"{API_BASE}/getUpdates?timeout=10"
            if offset:
                url += f"&offset={offset}"
            
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=20) as resp:
                updates = json.loads(resp.read().decode("utf-8")).get("result", [])
            
            for update in updates:
                offset = update["update_id"] + 1
                msg = update.get("message") or update.get("channel_post")
                if not msg:
                    continue
                
                chat = msg.get("chat", {})
                chat_id = chat.get("id")
                from_user = msg.get("from", {})
                first_name = from_user.get("first_name", "Friend")
                username = from_user.get("username", "")
                text = msg.get("text", "")
                
                print(f"[+] Message from @{username} ({chat_id}): {text}")
                save_chat_id(chat_id, {"username": username, "first_name": first_name})

                # Welcome & Pairing Confirmation Reply
                reply_text = (
                    f"👋 ሰላም <b>{first_name}</b>! እንኳን ደህና መጡ ወደ ሙዳይ ፍሪላንስ!\n\n"
                    f"✅ <b>Your Telegram account is now connected to MudayHub!</b>\n\n"
                    f"You will automatically receive instant alerts for:\n"
                    f"🛡️ <b>The Muday Vault:</b> Escrow milestone deposits\n"
                    f"📦 <b>Work Submissions:</b> Deliverable approvals & reviews\n"
                    f"💸 <b>Telebirr Payouts:</b> Instant release confirmations\n"
                    f"📝 <b>Proposals:</b> New bids & Solution Pitches\n\n"
                    f"<i>Chat ID: <code>{chat_id}</code></i>\n"
                    f"<a href=\"http://localhost:3000/dashboard\">👉 Open MudayHub Workspace</a>"
                )
                send_reply(chat_id, reply_text)
                
        except (TimeoutError, urllib.error.URLError):
            # Normal long-polling cycle completed with no new messages
            pass
        except Exception as e:
            if "timed out" not in str(e).lower():
                print(f"[!] Polling notice: {e}")
            time.sleep(2)

if __name__ == "__main__":
    main()
