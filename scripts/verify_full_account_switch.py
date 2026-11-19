import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import sys

proc = subprocess.Popen([
    "/usr/bin/google-chrome",
    "--headless=new",
    "--remote-debugging-port=9222",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--window-size=1280,1000"
])
time.sleep(1.5)

async def test_suite():
    req = urllib.request.Request("http://127.0.0.1:9222/json/new?http://localhost:3000/register", method="PUT")
    with urllib.request.urlopen(req) as r:
        target = json.loads(r.read().decode())
    
    async with websockets.connect(target["webSocketDebuggerUrl"]) as ws:
        msg_id = 0
        async def call(method, params=None):
            nonlocal msg_id
            msg_id += 1
            await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                msg = json.loads(await ws.recv())
                if msg.get("id") == msg_id:
                    return msg.get("result")

        await call("Page.enable")
        await asyncio.sleep(2)

        # 1. Initial State Check
        initial_check = await call("Runtime.evaluate", {
            "expression": """(() => {
                const freelancerRadio = document.querySelector('input[id="role-option-freelancer"]');
                const clientRadio = document.querySelector('input[id="role-option-client"]');
                const submitBtn = document.querySelector('button[type="submit"]');
                return {
                    freelancerChecked: freelancerRadio?.checked,
                    clientChecked: clientRadio?.checked,
                    submitText: submitBtn?.innerText
                };
            })()""",
            "returnByValue": True
        })
        print("1. Initial state:", initial_check["result"]["value"])
        assert initial_check["result"]["value"]["freelancerChecked"] is True
        assert "Freelancer" in initial_check["result"]["value"]["submitText"]

        # 2. Click Top Tab: Client
        await call("Runtime.evaluate", {
            "expression": """(() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('I Want to Hire Talent (Client)'));
                btn.click();
            })()"""
        })
        await asyncio.sleep(0.5)

        tab_switch_check = await call("Runtime.evaluate", {
            "expression": """(() => {
                const freelancerRadio = document.querySelector('input[id="role-option-freelancer"]');
                const clientRadio = document.querySelector('input[id="role-option-client"]');
                const submitBtn = document.querySelector('button[type="submit"]');
                return {
                    freelancerChecked: freelancerRadio?.checked,
                    clientChecked: clientRadio?.checked,
                    submitText: submitBtn?.innerText
                };
            })()""",
            "returnByValue": True
        })
        print("2. After Top Tab Click (Client):", tab_switch_check["result"]["value"])
        assert tab_switch_check["result"]["value"]["clientChecked"] is True
        assert "Client" in tab_switch_check["result"]["value"]["submitText"]

        # 3. Click Freelancer Card directly
        await call("Runtime.evaluate", {
            "expression": """(() => {
                const card = document.querySelector('label[for="role-option-freelancer"]');
                card.click();
            })()"""
        })
        await asyncio.sleep(0.5)

        card_freelancer_check = await call("Runtime.evaluate", {
            "expression": """(() => {
                const freelancerRadio = document.querySelector('input[id="role-option-freelancer"]');
                const clientRadio = document.querySelector('input[id="role-option-client"]');
                const submitBtn = document.querySelector('button[type="submit"]');
                return {
                    freelancerChecked: freelancerRadio?.checked,
                    clientChecked: clientRadio?.checked,
                    submitText: submitBtn?.innerText
                };
            })()""",
            "returnByValue": True
        })
        print("3. After Freelancer Card Click:", card_freelancer_check["result"]["value"])
        assert card_freelancer_check["result"]["value"]["freelancerChecked"] is True
        assert "Freelancer" in card_freelancer_check["result"]["value"]["submitText"]

        # 4. Click Client Card directly
        await call("Runtime.evaluate", {
            "expression": """(() => {
                const card = document.querySelector('label[for="role-option-client"]');
                card.click();
            })()"""
        })
        await asyncio.sleep(0.5)

        card_client_check = await call("Runtime.evaluate", {
            "expression": """(() => {
                const freelancerRadio = document.querySelector('input[id="role-option-freelancer"]');
                const clientRadio = document.querySelector('input[id="role-option-client"]');
                const submitBtn = document.querySelector('button[type="submit"]');
                return {
                    freelancerChecked: freelancerRadio?.checked,
                    clientChecked: clientRadio?.checked,
                    submitText: submitBtn?.innerText
                };
            })()""",
            "returnByValue": True
        })
        print("4. After Client Card Click:", card_client_check["result"]["value"])
        assert card_client_check["result"]["value"]["clientChecked"] is True
        assert "Client" in card_client_check["result"]["value"]["submitText"]

        # 5. Fill out form and submit as Client
        unique_email = f"test_client_{int(time.time())}@mudaytest.et"
        submit_res = await call("Runtime.evaluate", {
            "expression": f"""(() => {{
                function setNativeValue(element, value) {{
                    const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    valueSetter.call(element, value);
                    element.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}

                const textInputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
                const nameInput = textInputs[0];
                setNativeValue(nameInput, "Kidus Hiring Business");

                const emailInput = document.querySelector('input[type="email"]');
                setNativeValue(emailInput, "{unique_email}");

                const pwdInput = document.querySelector('input[type="password"]');
                setNativeValue(pwdInput, "MudayPass123!");

                const submitBtn = document.querySelector('button[type="submit"]');
                submitBtn.click();
                return "Submitted successfully";
            }})()""",
            "returnByValue": True
        })
        print(f"5. Form submitted with email {unique_email} as Client: {submit_res}")

        # Wait for navigation to /onboarding and loading to complete
        for _ in range(30):
            await asyncio.sleep(0.5)
            url_res = await call("Runtime.evaluate", {"expression": "window.location.pathname"})
            if url_res["result"]["value"] == "/onboarding":
                print("5b. Successfully reached /onboarding!")
                break

        # Wait until loading spinner/skeleton is gone
        for _ in range(30):
            await asyncio.sleep(0.5)
            is_loading = await call("Runtime.evaluate", {
                "expression": "Boolean(document.querySelector('.animate-pulse'))"
            })
            if not is_loading["result"]["value"]:
                print("5c. Onboarding page finished loading data!")
                break

        # 6. Check Onboarding Page Role
        onboarding_role = await call("Runtime.evaluate", {
            "expression": """(() => {
                const text = document.body.innerText;
                const isClient = text.includes("Client / Hiring Business") || text.includes("Hiring Entity") || text.includes("Categories You Plan to Hire");
                const hasSwitchBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Switch to Freelancer'));
                return { isClient, hasSwitchBtn, textSnippet: text.slice(0, 300) };
            })()""",
            "returnByValue": True
        })
        print("6. Onboarding role verification:", onboarding_role["result"]["value"])
        assert onboarding_role["result"]["value"]["isClient"] is True
        assert onboarding_role["result"]["value"]["hasSwitchBtn"] is True

        # 7. Click role switch button on Onboarding!
        print("7. Testing role switch on Onboarding page...")
        await call("Runtime.evaluate", {
            "expression": """(() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Switch to Freelancer'));
                btn.click();
            })()"""
        })
        await asyncio.sleep(1.5)

        switched_role = await call("Runtime.evaluate", {
            "expression": """(() => {
                const text = document.body.innerText;
                const isFreelancer = text.includes("Freelancer / Specialist");
                const hasSwitchBtn = text.includes("Switch to Client");
                return { isFreelancer, hasSwitchBtn };
            })()""",
            "returnByValue": True
        })
        print("7b. After switch on Onboarding:", switched_role["result"]["value"])
        assert switched_role["result"]["value"]["isFreelancer"] is True
        assert switched_role["result"]["value"]["hasSwitchBtn"] is True

        print("ALL 7 TESTS PASSED PERFECTLY!")

try:
    asyncio.run(test_suite())
finally:
    proc.terminate()
