#!/usr/bin/env python3
"""
MudayHub end-to-end escrow lifecycle test.

Run against a DEMO-mode dev server (no Supabase needed):
    DEMO_MODE=true npm run dev   # note which port it picks, default :3001
    python3 scripts/e2e_test.py http://localhost:3001

Covers: registration roles -> job -> proposal -> escrow contract (7% fee
split) -> mock-gateway funding via HMAC webhook -> redaction filters ->
work submission -> role guards -> payout release -> disputes -> admin
arbitration (release/refund) -> invalid-transition rejection.
"""
import json, os, urllib.request, urllib.parse, urllib.error, http.cookiejar, hmac, hashlib, sys

B = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3001").rstrip("/")
SECRET = os.environ.get("ESCROW_WEBHOOK_SECRET", "")
if not SECRET:
    raise SystemExit("Set ESCROW_WEBHOOK_SECRET to the local demo secret before running this script.")


class C:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def req(self, method, path, body=None, expect_error=False):
        data = json.dumps(body).encode() if body is not None else None
        r = self.opener.open(urllib.request.Request(
            B + path, data=data, method=method,
            headers={"Content-Type": "application/json"} if data else {}))
        raw = r.read().decode()
        try:
            return json.loads(raw)
        except Exception:
            return raw

    def req_expect_error(self, method, path, body=None):
        """For negative-path tests: return the parsed error body + status."""
        data = json.dumps(body).encode() if body is not None else None
        try:
            r = self.opener.open(urllib.request.Request(
                B + path, data=data, method=method,
                headers={"Content-Type": "application/json"} if data else {}))
            raw = r.read().decode()
            try:
                return json.loads(raw), r.status
            except Exception:
                return raw, r.status
        except urllib.error.HTTPError as e:
            raw = e.read().decode()
            try:
                return json.loads(raw), e.code
            except Exception:
                return raw, e.code

    def login(self, email, pwd):
        out = self.req("POST", "/api/auth/login", {"email": email, "password": pwd})
        assert "error" not in out, f"login failed: {out}"


def fund(c, amt):
    """Drive mock gateway -> HMAC-signed webhook -> funded transition."""
    body = json.dumps({"tx_ref": c["payment_reference"], "status": "success", "amount": amt})
    sig = hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    form = ("body=" + urllib.parse.quote(body) + "&return=/contracts/"
            + urllib.parse.quote(c["id"]) + "&callback=" + urllib.parse.quote(B + "/api/escrow/webhook"))
    r = urllib.request.urlopen(urllib.request.Request(
        B + "/api/escrow/mock-pay", data=form.encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST"))
    return r.status, r.read().decode()


cli = C(); cli.login("client@mudayhub.et", "demo1234")
frl = C(); frl.login("freelancer@mudayhub.et", "demo1234")
adm = C(); adm.login("admin@mudayhub.et", "demo1234")
print("== 3 sandbox logins ok ==")

print("== client posts job ==")
job = cli.req("POST", "/api/jobs", {"title": "QA pipeline", "description": "build ci",
                                     "category": "DevOps", "budget_etb": 10000, "skills": ["CI"]})
assert not job.get("error"), job
jobid = job["job"]["id"]

print("== freelancer proposes (9000, 10d) ==")
prop = frl.req("POST", "/api/proposals", {"job_id": jobid, "bid_amount_etb": 9000,
                                          "duration_days": 10, "cover_letter": "I can do this fast."})
assert not prop.get("error"), prop
pid = prop["proposal"]["id"]

print("== client accepts -> escrow contract (7% fee split) ==")
c = cli.req("POST", f"/api/proposals/{pid}/accept")["contract"]
assert c["escrow_status"] == "awaiting_deposit", c
assert c["platform_fee_etb"] == 630.0 and c["freelancer_net_etb"] == 8370.0, c
print("   total 9000 -> fee 630, freelancer net 8370 (0.93) OK")

print("== anti-disintermediation redaction (pre-funding) ==")
m = frl.req("POST", "/api/messages", {"contractId": c["id"], "body": "call me +251911234567 or @myhandle"})
assert m["redacted"] and "[phone redacted]" in m["message"]["body"] and "[handle redacted]" in m["message"]["body"], m
print("   filtered ->", m["message"]["body"])

print("== client escrow checkout (mock gateway) ==")
co = cli.req("POST", "/api/escrow/checkout", {"contractId": c["id"]})
assert co["session"]["checkoutUrl"], co
print("   provider:", co["session"]["provider"], "| ref:", co["session"]["reference"])

print("== mock gateway pays -> HMAC webhook -> funded ==")
st, txt = fund(c, 9000)
assert st == 200, (st, txt)
c2 = frl.req("GET", f"/api/contracts/{c['id']}")["contract"]
assert c2["escrow_status"] == "funded", c2["escrow_status"]
print("   escrow funded via verified webhook")

print("== unsigned webhook rejected ==")
bad, code = frl.req_expect_error("POST", "/api/escrow/webhook")
assert code == 401 and bad["error"] == "Invalid signature", (code, bad)
print("   -> 401", bad)

print("== freelancer submits work ==")
sw = frl.req("POST", "/api/escrow/submit-work", {"contractId": c["id"],
                                                  "work_submission_url": "https://github.com/x/y"})
assert sw["contract"]["escrow_status"] == "work_submitted", sw
print("   -> work_submitted (72h review window)")

print("== redaction lifted post-funding ==")
m2 = frl.req("POST", "/api/messages", {"contractId": c["id"], "body": "call +251911234567"})
assert not m2["redacted"] and "+251911234567" in m2["message"]["body"], m2
print("   contact now visible")

print("== role guard: freelancer cannot release ==")
fr_bad, _ = frl.req_expect_error("POST", "/api/escrow/release", {"contractId": c["id"]})
assert fr_bad["error"] == "Only client can release", fr_bad
print("   ->", fr_bad["error"])

print("== client releases -> Telebirr payout ==")
rel = cli.req("POST", "/api/escrow/release", {"contractId": c["id"]})
assert rel["contract"]["escrow_status"] == "completed", rel
assert rel["payout"]["amountEtb"] == 8370.0, rel
print("   completed; net payout 8370 ->", rel["payout"]["destination"], "(", rel["payout"]["transferId"], ")")

print("== freelancer notifications ==")
notes = [n["title"] for n in frl.req("GET", "/api/notifications")["notifications"]]
print("   ", notes[:6])

print("== dispute + admin arbitration (release) ==")
job2 = cli.req("POST", "/api/jobs", {"title": "Audit", "description": "d",
                                      "category": "Security Audit", "budget_etb": 5000})["job"]["id"]
pr2 = frl.req("POST", "/api/proposals", {"job_id": job2, "bid_amount_etb": 4500,
                                         "duration_days": 5, "cover_letter": "x"})
ac2 = cli.req("POST", f"/api/proposals/{pr2['proposal']['id']}/accept")["contract"]
cli.req("POST", "/api/escrow/checkout", {"contractId": ac2["id"]}); fund(ac2, 4500)
d = frl.req("POST", "/api/escrow/dispute", {"contractId": ac2["id"], "reason": "Client unresponsive"})
assert d["dispute"]["status"] == "open", d
assert frl.req("GET", f"/api/contracts/{ac2['id']}")["contract"]["escrow_status"] == "disputed"
print("   disputed; funds frozen")
a = adm.req("PATCH", "/api/admin/disputes", {"disputeId": d["dispute"]["id"], "status": "under_review"})
assert a["dispute"]["status"] == "under_review", a
adm.req("PATCH", "/api/admin/disputes", {"disputeId": d["dispute"]["id"], "status": "resolved",
                                          "resolution_notes": "Deliverables verified; release",
                                          "outcome": "release"})
assert frl.req("GET", f"/api/contracts/{ac2['id']}")["contract"]["escrow_status"] == "completed"
print("   admin released -> completed")

print("== non-admin cannot reach arbitration ==")
fr_adm, code = frl.req_expect_error("GET", "/api/admin/disputes")
assert code == 403 and fr_adm["error"] == "Forbidden", (code, fr_adm)
print("   -> 403", fr_adm)

print("== invalid transition blocked (release from awaiting_deposit) ==")
job3 = cli.req("POST", "/api/jobs", {"title": "T", "description": "d",
                                      "category": "DevOps", "budget_etb": 2000})["job"]["id"]
pr3 = frl.req("POST", "/api/proposals", {"job_id": job3, "bid_amount_etb": 1800,
                                          "duration_days": 3, "cover_letter": "y"})
ac3 = cli.req("POST", f"/api/proposals/{pr3['proposal']['id']}/accept")["contract"]
badrel, _ = cli.req_expect_error("POST", "/api/escrow/release", {"contractId": ac3["id"]})
assert "Invalid" in badrel["error"], badrel
print("   ->", badrel["error"])

print("== refund path via admin (disputed -> refunded) ==")
job4 = cli.req("POST", "/api/jobs", {"title": "R", "description": "d",
                                      "category": "DevOps", "budget_etb": 3000})["job"]["id"]
pr4 = frl.req("POST", "/api/proposals", {"job_id": job4, "bid_amount_etb": 2800,
                                          "duration_days": 4, "cover_letter": "z"})
ac4 = cli.req("POST", f"/api/proposals/{pr4['proposal']['id']}/accept")["contract"]
cli.req("POST", "/api/escrow/checkout", {"contractId": ac4["id"]}); fund(ac4, 2800)
frl.req("POST", "/api/escrow/dispute", {"contractId": ac4["id"], "reason": "Scope never met"})
adml = [x for x in adm.req("GET", "/api/admin/disputes")["disputes"]
       if x["contract_id"] == ac4["id"] and x["status"] == "open"]
adm.req("PATCH", "/api/admin/disputes", {"disputeId": adml[0]["id"], "status": "resolved",
                                          "resolution_notes": "Not started; full refund",
                                          "outcome": "refund"})
assert frl.req("GET", f"/api/contracts/{ac4['id']}")["contract"]["escrow_status"] == "refunded"
print("   admin refunded -> refunded")

print("\nALL E2E STEPS PASSED  (13 guards exercised)")
