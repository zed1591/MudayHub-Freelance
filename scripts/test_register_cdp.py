import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import sys

chrome_proc = subprocess.Popen([
    "/usr/bin/google-chrome",
    "--headless=new",
    "--remote-debugging-port=9222",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage"
])

try:
    time.sleep(1.5)
    
    # Query targets
    req = urllib.request.Request("http://127.0.0.1:9222/json/new?http://localhost:3000/register", method="PUT")
    with urllib.request.urlopen(req) as response:
        page_data = json.loads(response.read().decode())
    ws_url = page_data["webSocketDebuggerUrl"]
    print("Attached to Chrome target:", ws_url)

    async def run():
        async with websockets.connect(ws_url) as ws:
            msg_id = 0
            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get("id") == msg_id:
                        return resp.get("result")
                    else:
                        if resp.get("method") == "Runtime.consoleAPICalled":
                            args = [str(a.get("value")) for a in resp.get("params", {}).get("args", [])]
                            print("[CONSOLE]", " ".join(args))
                        elif resp.get("method") == "Runtime.exceptionThrown":
                            print("[EXCEPTION]", resp)

            # Enable events
            await send("Runtime.enable")
            await send("Log.enable")
            await send("Page.enable")

            # Wait for load
            await asyncio.sleep(2)

            # Check if any errors occurred
            eval_res = await send("Runtime.evaluate", {
                "expression": "document.body.innerText"
            })
            print("Document text length:", len(eval_res.get("result", {}).get("value", "")))

            # Inspect buttons on page
            btn_eval = await send("Runtime.evaluate", {
                "expression": """
                Array.from(document.querySelectorAll('button')).map((b, i) => `${i}: "${b.innerText.replace(/\\n/g, ' ')}" [type=${b.type}]`).join('\\n')
                """
            })
            print("Buttons found:\\n", btn_eval.get("result", {}).get("value"))

            # Check role before click
            role_before = await send("Runtime.evaluate", {
                "expression": "document.querySelector('input[name=\"role\"]')?.value"
            })
            print("Role input before click:", role_before.get("result", {}).get("value"))

            # Click the Client button
            click_res = await send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('I Want to Hire Talent (Client)'));
                    if (btn) {
                        btn.click();
                        return "Clicked button";
                    }
                    return "Button not found";
                })()
                """
            })
            print("Click result:", click_res.get("result", {}).get("value"))

            await asyncio.sleep(1)

            # Check role after click
            role_after = await send("Runtime.evaluate", {
                "expression": "document.querySelector('input[name=\"role\"]')?.value"
            })
            print("Role input after click:", role_after.get("result", {}).get("value"))

            # Check submit button text
            submit_btn = await send("Runtime.evaluate", {
                "expression": "document.querySelector('button[type=\"submit\"]')?.innerText"
            })
            print("Submit button text after click:", submit_btn.get("result", {}).get("value"))

    asyncio.run(run())
finally:
    chrome_proc.terminate()
