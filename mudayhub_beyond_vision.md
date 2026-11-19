# MudayHub — BEYONPUND: The Next Decade of High-Trust Ethiopian Freelancing

This document is the forward-looking expansion of the MudayHub Freelance platform described in
`mudayhub_freelance_platform_documentation.md`. It covers what comes **beyond** the v1 marketplace:
milestone escrow, multi-track contracts, on-chain reputation, institutional SLAs, and the eventual
cross-border settlement story. It is deliberately ordered from "the hardest, highest-leverage part"
to the long tail.

---

## 0. Guiding Principle: build the difficult part first

The single hardest, highest-leverage piece of a freelance platform is **trust without a central
enforcer**: guaranteeing that money moves correctly between parties that do not know or trust each
other, across volatile domestic rails, with an audit trail that survives disputes. Everything in
v1 (the programmatic escrow state machine) exists to solve this. The roadmap below treats each
future capability as a *deepening* of that same invariant rather than a new product.

**Invariant that must never break:** *the frontend never writes financial state.* Every v1 API
route that mutates `contracts.escrow_status` runs on the service role and asserts a legal
transition via `assertTransition`. Every capability in this document preserves that boundary.

---

## 1. From single-shot escrow to **milestone contracts**

v1 funds the whole contract at acceptance and releases it all at once. Real engagements are
phased. Beyond-v1 introduces a `milestones` table:

```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  title TEXT NOT NULL,
  amount_etb NUMERIC(12,2) NOT NULL CHECK (amount_etb > 0),
  due_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked','active','submitted','released','disputed','refunded')),
  UNIQUE (contract_id, ordinal)
);
```

Rules:

- `SUM(amount_etb) OVER (PARTITION BY contract_id) = contracts.total_amount_etb` (enforced by a
  trigger + a partial unique index guarding the invariant).
- Each milestone runs the *same* state machine as the contract, but scoped to `milestone.status`.
- The 7% fee is charged per milestone release, not per contract, so the platform only earns on
  delivered value. This converts the fee from a *cost of joining* into a *cost of trust*, which is
  the difference between churn and retention.

**Why first:** milestones are what turn one-off gigs into recurring revenue and make the
anti-disintermediation flywheel (reputation capital, §4) meaningful — a freelancer can't "take the
client elsewhere" when there are three protected releases still ahead.

---

## 2. **Multi-track** contracts & team work

v1 is one client ↔ one freelancer. Enterprises hire teams. Beyond-v1 adds:

- `contract_teams` (a role per member: lead, developer, reviewer, arbiter-sponsor).
- Split-payout ledger: `payouts` table with `(milestone_id, payee_id, amount_etb, fee_etb,
  transfer_id, state)`. The release path fans one milestone out to N Telebirr destinations
  atomically — any single payout failure rolls the whole release back (compensating transaction,
  retried idempotently by `transfer_id`).
- A **worklog** feed (time-boxed entries against a milestone) so a client approves *progress*,
  not just a final URL. This is the evidence layer disputes (§5) will draw on.

**Hardest sub-problem:** atomic fan-out of a domestic B2B transfer to multiple beneficiaries with
no netting guarantee. Mitigation: pre-verify all beneficiary numbers at contract creation;
require each team member to complete KYC before the team is funded.

---

## 3. **On-chain reputation ledger** (the "verifiable trust" moat)

v1 stores reputation in a column (`profiles.rating`) and a demo store. The real moat is a
*ledger the client can't falsify and the platform can't quietly edit*:

- Every released milestone mints a **deed** — a content-addressed record
  `sha256(contract_id, milestone_id, freelancer_id, amount_etb, delivered_at, reviewer_signature)`.
  Deeds are appended to a public, append-only registry (an Ethereum L2 rollup of signed
  Merkle roots is the canonical choice; the key point is *append-only + third-party verifiable*,
  not "blockchain" for its own sake).
- Freelancer tier (Novice → Verified → Elite → Institution-eligible) is a pure function of the
  Merkle tree, not a mutable column. Enterprise jobs (§6) gate on this.
- Off-platform work produces zero deeds by construction, which is exactly the
  anti-disintermediation property from the original doc §7 — now cryptographic.

**Why it is "the difficult part" the user asked for first:** it is the only feature that creates a
compounding, portable asset. A freelancer's reputation becomes *theirs* and survives MudayHub's
existence — which is the strongest retention loop a platform can offer.

---

## 4. **Arbitration 2.0**: structured disputes & partial settlement

v1 disputes are free-text + a binary release/refund. Beyond-v1:

- Categorized dispute taxonomy (missed deadline, scope creep, non-compliant deliverable,
  unresponsive party) that a small trained model pre-tags for the arbiter.
- **Partial settlement**: an arbiter can release `0–100%` of a disputed milestone, written as a
  deterministic split recorded on the ledger (§3). This reflects reality — most disputes end in a
  negotiated middle, not an all-or-nothing.
- **Structured evidence**: parties attach worklog snapshots (§2) and, for code work, a read-only
  diff/commit pointer the arbiter can inspect without either party's live access.
- **SLA on the arbiter**: disputes get a resolution SLA (e.g., 72h) tracked on the ledger, so a
  dispute itself becomes reputation-relevant for *both* parties.

**Hard part:** keeping the split logic deterministic and replayable. Resolution must be a pure
function of `(dispute_id, split_pct, decided_by, decided_at)`; the platform never stores an
ad-hoc "we decided to pay 43%" — it stores the *rule* that produced the amount.

---

## 5. **Real payment rails** beyond the mock gateway

v1 ships a `mock` provider and a Chapa adapter; Telebirr B2B payout is a placeholder. The order in
which to make this production-grade:

1. **Chapa live** — the gateway is already abstracted (`lib/escrow/gateways`). Set
   `PAYMENT_PROVIDER=chapa` + `CHAPA_SECRET_KEY`. Confirm the HMAC verification path
   (`verifyWebhook` → `timingSafeEqual`) against Chapa's real `x-chapa-signature` scheme and
   replay window before taking real money.
2. **Telebirr B2B** — the payout side. The `PaymentGateway.payout` contract is already
   shape-stable; implement the Telebirr merchant API, add beneficiary pre-verification (§2), and
   add an idempotency key = `transfer_id` so a retried release never double-pays.
3. **CBE Birr / bank rails** — for higher-value enterprise contracts above mobile-wallet limits.
   Model as a separate provider; the state machine is unchanged, only the *settlement transport*
   differs.
4. **FX off-ramp (optional, later)** — for diaspora or export-sector clients, a pegged off-ramp
   so a freelancer can receive USD-stable settlement. This is *opt-in and off the core ETB
   invariant*; do not couple it to the main escrow path.

**Invariants that must hold across every rail:**
- Funding is idempotent on `payment_reference` (a replayed webhook must be a no-op).
- `assertTransition` is the only state writer; no rail may set status directly.
- Every `completed`/`refunded` terminal is preceded by a ledger deed (§3).

---

## 6. **Institutional tier**: enterprise SLAs & compliance

The original doc already routes enterprise work to top-verified tiers. Beyond-v1 adds:

- **Dedicated arbiter pool** (the `admin` role becomes `arbiter` with a caseload + SLA).
- **Contract templates** with pre-filled milestone plans, acceptance criteria, and penalty terms.
- **Data residency / audit**: per-tenant export of the full engagement ledger for the client's own
  compliance, signed so it is provably from MudayHub.
- **Insurance option**: a per-contract "delivery guarantee" where a portion of the fee underwrites
  an automatic partial refund if the arbiter rules delivery non-compliant — turning dispute risk
  into a priced, market-clearing product.

---

## 7. **Network & product expansion**

- **Bilingual-by-default**: full Amharic (Nyala/Noto Ethiopic already in the font stack) UI and
  legal microcopy; `en|am` locale on every money and status string.
- **Freelancer wallet**: a balance view of funded-but-unreleased amounts across milestones, plus
  a scheduled *partial* release cadence (e.g., 50% at submit, 50% at approve) that the state
  machine already permits if split.
- **Service PWA-first, then native**: the shell is already an installable PWA with an offline
  fallback (`public/sw.js`). The natural next step is a lightweight native wrapper only where
  push/offline is genuinely required; do not fragment the codebase.
- **Trust signals on the card**: show `rating`, deed count, and "X protected contracts" on the
  `JobCard` so buyers can see verifiable history at a glance.

---

## 8. Sequencing & the "do the hard thing first" order

| # | Capability | Why this order | Effort |
|---|-----------|----------------|--------|
| 1 | Real rails (Chapa live + Telebirr payout) | You can't sell trust you can't settle | M |
| 2 | Milestone contracts | Turns one-off into recurring, unblocks everything else | M–L |
| 3 | On-chain reputation ledger | The compounding asset / moat; depends on milestones | L |
| 4 | Arbitration 2.0 + partial settlement | Depends on worklog + ledger evidence | M |
| 5 | Multi-track teams + fan-out payout | Depends on rail idempotency + KYC | L |
| 6 | Institutional tier + insurance | Commercialization, on top of the above | M |

**The single most difficult part, stated plainly:** *deterministic, idempotent, append-only
settlement across volatile domestic rails, with a cryptographic reputation ledger on top.* That
combination — not any single screen or table — is where the platform's real value lives, and it is
the thing to engineer with the most care.

---

## 9. Open risks to name now

- **Telebirr B2B capacity & limits** may force the CBE/rail split (§5.3) earlier than planned.
- **FX regulation**: any off-ramp (§5.4) must be cleared through National Bank of Ethiopia rules;
  keep it fully decoupled from the ETB core until then.
- **Arbiter load** grows super-linearly with disputes; the SLA + insurance product (§6) is what
  keeps it from becoming a bottleneck.
- **Ledger finality**: if a deed turns out to reference a later-disputed release, the split in §4
  must be expressible *without* rewriting the tree — hence append-only + new superseding records,
  never in-place edits.
