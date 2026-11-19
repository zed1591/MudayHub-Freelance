import { NextResponse } from "next/server";
import { signMockWebhook } from "@/lib/escrow/gateways/mock";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore } from "@/lib/demo/store";

export async function GET(req: Request) {
  if (!isDemoMode()) return new NextResponse("Not found", { status: 404 });
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref");
  const contract = readStore().contracts.find((entry) => entry.payment_reference === ref);
  if (!contract || contract.escrow_status !== "awaiting_deposit") return new NextResponse("Payment session expired", { status: 404 });
  const paymentReference = ref || "";
  const amount = Number(contract.total_amount_etb);
  const suppliedReturn = new URL(url.searchParams.get("return") || `/contracts/${contract.id}`, url.origin);
  const returnUrl = suppliedReturn.origin === url.origin ? suppliedReturn.toString() : `${url.origin}/contracts/${contract.id}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Demo payment · MudayHub</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #F7F8FA;
      color: #1F2937;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid rgba(217, 119, 33, 0.25);
      border-radius: 24px;
      padding: 2.25rem;
      max-width: 460px;
      width: 100%;
      box-shadow: 0 16px 42px -16px rgba(28, 35, 45, 0.22), 0 0 32px rgba(217, 119, 33, 0.08);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(28, 35, 45, 0.10);
    }
    .badge {
      display: inline-block;
      background: rgba(223, 138, 51, 0.15);
      color: #9A4B0C;
      border: 1px solid rgba(217, 119, 33, 0.30);
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      color: #1F2937;
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    p { color: #667085; font-size: 0.85rem; line-height: 1.5; }
    .amount-box {
      background: #F7F8FA;
      border: 1px solid rgba(28, 35, 45, 0.08);
      border-radius: 16px;
      padding: 1.25rem;
      text-align: center;
      margin: 1.25rem 0;
    }
    .amt-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #667085; font-weight: 600; }
    .amt { font-size: 2.25rem; font-weight: 800; color: #10B981; font-family: ui-monospace, monospace; margin-top: 4px; }
    .rail-select {
      display: flex;
      gap: 8px;
      margin-bottom: 1.25rem;
    }
    .rail-opt {
      flex: 1;
      padding: 10px;
      border: 1px solid rgba(223, 138, 51, 0.4);
      background: rgba(223, 138, 51, 0.1);
      border-radius: 12px;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 700;
      color: #9A4B0C;
      cursor: pointer;
    }
    .btn-pay {
      width: 100%;
      background: linear-gradient(135deg, #E38A35 0%, #B94F2B 100%);
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 14px;
      padding: 1rem;
      font-size: 0.95rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(223, 138, 51, 0.4);
      transition: all 0.2s ease;
    }
    .btn-pay:hover {
      transform: translateY(-1.5px);
      box-shadow: 0 8px 22px rgba(223, 138, 51, 0.55);
    }
    .btn-cancel {
      display: block;
      text-align: center;
      margin-top: 12px;
      color: #667085;
      font-size: 0.8rem;
      text-decoration: none;
    }
    .btn-cancel:hover { color: #1F2937; }
    .footer-note {
      font-size: 0.72rem;
      margin-top: 1.25rem;
      color: #7B8491;
      text-align: center;
      line-height: 1.4;
    }
    code { font-family: monospace; color: #DF8A33; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Muday-Freelance Escrow</span>
      <h1>Demo checkout</h1>
    </div>
    
    <p>This simulated payment is for product walkthroughs only. It does not move real money.</p>
    
    <div class="amount-box">
      <div class="amt-label">Deposit Amount Required</div>
      <div class="amt">${Number(amount).toLocaleString()} ETB</div>
    </div>

    <div class="rail-select">
      <div class="rail-opt">✓ Demo payment</div>
      <div class="rail-opt" style="border-color:rgba(255,255,255,0.1); background:rgba(255,255,255,0.02); color:#94A3B8;">CBE Birr</div>
      <div class="rail-opt" style="border-color:rgba(255,255,255,0.1); background:rgba(255,255,255,0.02); color:#94A3B8;">Chapa</div>
    </div>

    <form method="POST" action="/api/escrow/mock-pay">
      <input type="hidden" name="ref" value="${paymentReference.replace(/[^a-zA-Z0-9_-]/g, "")}" />
      <input type="hidden" name="return" value="${returnUrl.replace(/"/g, "&quot;")}" />
      <button type="submit" class="btn-pay">Simulate payment</button>
      <a href="${returnUrl}" class="btn-cancel">Cancel and Return</a>
    </form>

    <p class="footer-note">
      Ref: <code>${paymentReference.replace(/</g, "")}</code><br/>
      Demonstration only · No payment is processed
    </p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  if (!isDemoMode()) return new NextResponse("Not found", { status: 404 });
  const form = await req.formData();
  let ref = String(form.get("ref") || "");
  const suppliedBody = form.get("body") ? String(form.get("body")) : null;
  if (!ref && suppliedBody) {
    try {
      const parsed = JSON.parse(suppliedBody);
      ref = String(parsed.tx_ref || parsed.reference || "");
    } catch {
      // ignore JSON parse error
    }
  }

  const contract = readStore().contracts.find((entry) => entry.payment_reference === ref || entry.id === ref);
  if (!contract || contract.escrow_status !== "awaiting_deposit") return new NextResponse("Payment session expired", { status: 404 });
  const body = suppliedBody || JSON.stringify({ tx_ref: ref, status: "success", amount: Number(contract.total_amount_etb), currency: "ETB" });
  const requestUrl = new URL(req.url);
  const suppliedReturn = new URL(String(form.get("return") || `/contracts/${contract.id}`), requestUrl.origin);
  const returnUrl = suppliedReturn.origin === requestUrl.origin ? suppliedReturn.toString() : `${requestUrl.origin}/contracts/${contract.id}`;
  const callback = String(form.get("callback") || `${requestUrl.origin}/api/escrow/webhook`);

  const signature = signMockWebhook(body);
  const webhookRes = await fetch(callback, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-chapa-signature": signature,
    },
    body,
  });

  if (!webhookRes.ok) {
    const err = await webhookRes.text();
    return NextResponse.json(
      { error: "Webhook failed", detail: err },
      { status: 500 }
    );
  }

  return NextResponse.redirect(returnUrl, { status: 303 });
}
