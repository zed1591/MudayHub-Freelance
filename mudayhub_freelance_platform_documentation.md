# Muday-Freelance Platform: System Documentation & Product Architecture

## 1. Executive Summary & Platform Mission

Muday-Freelance is a high-trust digital services marketplace combining pre-packaged 3-tier service gigs and custom project RFPs with non-custodial Telebirr & CBE Birr escrow settlement.

### 1.1 The Market Problem

* **Informal Channel Vulnerability:** Domestic freelancing primarily transacts through unmoderated Telegram channels and private direct messages. This environment suffers from rampant non-payment scams, deliverable theft, ghosting, and a complete lack of arbitration mechanisms.

* **Foreign Currency Friction:** Global platforms (such as Upwork, Fiverr, and Freelancer) mandate international payment rails (PayPal, Payoneer, foreign debit/credit cards) that are inaccessible or heavily restricted for domestic Ethiopian transactions due to strict foreign exchange regulations.

* **Lack of Trust Capital:** Employers struggle to verify the authentic technical aptitude and identity of local freelancers, while talented creators have no verifiable on-chain or audited reputation record.

### 1.2 Core Value Proposition

* **Programmatic Escrow:** Securing milestone payments upfront using domestic financial infrastructure (Telebirr, CBE Birr, Chapa) so that funds are guaranteed prior to project initiation.

* **100% ETB Settlement:** Local currency transactions with zero reliance on foreign bank accounts or foreign currency conversion bottlenecks.

* **Low-Bandwidth Mobile Optimization:** A progressive web app (PWA) client footprint engineered to run smoothly on variable 3G/4G cellular connections across Ethiopia.

* **Localized Identity & Verification:** Integration with national identity vectors (e.g., Fayda / authenticated phone records) combined with verified portfolio auditing.

## 2. High-Level System Architecture

```
+-------------------------------------------------------------------------+
|                        Client Layer (SPA / PWA)                         |
|      React + Tailwind CSS + Lucide Icons + Supabase Client SDK          |
+-------------------------------------------------------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
+-------------------------------+         +-------------------------------+
|  Supabase Platform Services   |         |   Escrow Microservice API     |
|  - Auth (OTP & Session Tokens)|         |   - Payment Checkout Session  |
|  - PostgreSQL with RLS        |         |   - HMAC Webhook Verification |
|  - Realtime WebSocket Channels|         |   - Automated Payout Transfer |
|  - Asset Object Storage       |         +-------------------------------+
+-------------------------------+                          |
               ^                                           v
               |                          +-------------------------------+
               +--------------------------|   Local Payment Gateways      |
                     Database Updates     |   - Telebirr B2B / Webhook    |
                     & Audit Logs         |   - Chapa Aggregator API      |
                                          |   - CBE Birr Integration      |
                                          +-------------------------------+

```

### 2.1 Architectural Invariants

1. **Decoupled Client & Identity:** The client interface interacts directly with Supabase for data queries and real-time state, protected by strict Row-Level Security (RLS).

2. **Restricted Financial Authority:** The frontend never modifies escrow state directly. All transitions from `awaiting_deposit` to `funded`, and from `work_submitted` to `completed`, require cryptographic verification executed exclusively by the backend service.

3. **Stateless Scalability:** Core application services run on lightweight containerized instances or serverless edge functions, allowing immediate horizontal scaling.

## 3. Database Schema & Data Models Specification

The system uses a relational PostgreSQL database (hosted via Supabase) with Row-Level Security enabled on all core tables.

### 3.1 Profiles Entity (`profiles`)

* **Purpose:** Extends the built-in Supabase authentication system with specialized user profile data.

* **Attributes & Constraints:**

  * `id`: UUID, Primary Key, references authentication user table with cascade deletion.

  * `role`: String enumeration restricted strictly to `'client'`, `'freelancer'`, or `'admin'`. Defaults to `'freelancer'`.

  * `full_name`: String, required.

  * `phone`: Unique localized string format matching Ethiopian mobile operators (`+2519...` or `+2517...`).

  * `bio`: Text block for summary and background.

  * `skills`: Array of text tags representing competencies (e.g., React, Penetration Testing, Figma).

  * `telebirr_number`: Phone account designated for automated settlement payouts.

  * `rating`: Decimal floating point bounded between 1.00 and 5.00, defaulting to 5.00.

  * `is_verified`: Boolean flag indicating completed KYC/portfolio verification. Defaults to `false`.

  * `created_at`: UTC timestamp of registration.

* **Security & Access Rules:**

  * Publicly readable for marketplace discovery.

  * Write/update access strictly restricted to the owning user.

### 3.2 Job Postings Entity (`jobs`)

* **Purpose:** Stores project briefs, scopes of work, and budgetary bounds posted by hiring clients.

* **Attributes & Constraints:**

  * `id`: Unique UUID Primary Key.

  * `client_id`: UUID, Foreign Key linking to `profiles.id`.

  * `title`: Concise project headline.

  * `description`: Comprehensive brief detailing deliverables, technical expectations, and constraints.

  * `category`: Taxonomy classification (e.g., Frontend Development, Security Audit, Brand Design, Amharic Translation).

  * `budget_etb`: Numeric budget in Ethiopian Birr, strictly enforced to be greater than or equal to 100 ETB.

  * `status`: Enumerated state tracking (`'open'`, `'in_progress'`, `'completed'`, `'cancelled'`). Defaults to `'open'`.

  * `created_at`: UTC creation timestamp.

* **Security & Access Rules:**

  * Publicly queryable while status is `'open'`.

  * Modification and deletion restricted exclusively to the original creator (`client_id`).

### 3.3 Proposals & Bids Entity (`proposals`)

* **Purpose:** Formal proposals submitted by freelancers against open job listings.

* **Attributes & Constraints:**

  * `id`: Unique UUID Primary Key.

  * `job_id`: UUID, Foreign Key linking to `jobs.id`.

  * `freelancer_id`: UUID, Foreign Key linking to `profiles.id`.

  * `bid_amount_etb`: Proposed compensation value, must be greater than or equal to 50 ETB.

  * `duration_days`: Positive integer representing estimated calendar days to delivery.

  * `cover_letter`: Text pitch explaining implementation approach and relevant experience.

  * `status`: State tracker (`'pending'`, `'accepted'`, `'rejected'`). Defaults to `'pending'`.

  * `created_at`: UTC timestamp.

  * **Integrity Constraint:** Composite unique index on `(job_id, freelancer_id)` to prevent spam and duplicate proposal submissions.

* **Security & Access Rules:**

  * Proposals are private; visible only to the bidding freelancer and the job's hiring client.

  * Insert operations allowed only by authenticated freelancers.

### 3.4 Contracts & Escrow Entity (`contracts`)

* **Purpose:** The formal, legally binding record holding financial state for active engagements.

* **Attributes & Constraints:**

  * `id`: Unique UUID Primary Key.

  * `job_id`: UUID Foreign Key referencing `jobs.id`.

  * `proposal_id`: UUID Foreign Key referencing `proposals.id`.

  * `client_id`: UUID Foreign Key identifying the hiring entity.

  * `freelancer_id`: UUID Foreign Key identifying the service provider.

  * `total_amount_etb`: Gross project amount funded into escrow.

  * `platform_fee_etb`: Calculated platform retention fee (7% of total).

  * `freelancer_net_etb`: Net sum owed to freelancer (`total_amount_etb - platform_fee_etb`).

  * `escrow_status`: Strict financial state enumeration (`'awaiting_deposit'`, `'funded'`, `'work_submitted'`, `'completed'`, `'disputed'`, `'refunded'`).

  * `payment_reference`: Cryptographic transaction reference generated during gateway checkout.

  * `work_submission_url`: External link pointing to submitted code repositories, staging servers, or deliverables.

  * `created_at`: UTC timestamp.

* **Security & Access Rules:**

  * Read access restricted exclusively to the participating client, the participating freelancer, and platform administrators.

  * Mutations on `escrow_status` and financial totals are forbidden from direct client queries; modifications occur solely via backend services.

### 3.5 Disputes & Arbitration Entity (`disputes`)

* **Purpose:** Case logging for projects requiring human intervention and arbitration.

* **Attributes & Constraints:**

  * `id`: Unique UUID Primary Key.

  * `contract_id`: UUID Foreign Key referencing `contracts.id`.

  * `raised_by`: UUID identifying the initiating user.

  * `reason`: Categorized issue summary (e.g., Unresponsive Client, Non-compliant Deliverables, Missed Deadlines).

  * `evidence_url`: Supporting documentation or screenshot archive.

  * `status`: Enumerated resolution state (`'open'`, `'under_review'`, `'resolved'`).

  * `resolution_notes`: Official platform findings and split percentage determinations.

## 4. Escrow Financial Engine & State Machine

### 4.1 Financial Rules & Split Logic

To remain attractive and encourage adherence to the platform, fees should remain substantially lower than foreign competitors (which often exceed 20%):

* **Platform Commission:** Flat 7% deducted from the gross milestone value upon successful contract completion.

* **Processing Surcharge:** Payment gateway pass-through fees (1.5% to 2.5%) applied to initial client funding.

* **Mathematical Allocation:**
  

  $$
  \text{Freelancer Payout} = \text{Total Escrow Amount} \times 0.93
  $$

  $$
  \text{Platform Revenue} = \text{Total Escrow Amount} \times 0.07
  $$

### 4.2 Lifecycle & State Machine Transitions

```
 1. Contract Created
    [ awaiting_deposit ]
             │
             │ Client deposits funds via Telebirr / Chapa
             ▼
 2. Webhook Verified (HMAC-SHA256)
    [ funded ] ─────────────────────────┐
             │                          │
             │ Freelancer submits proof │ Dispute raised
             ▼                          ▼
 3. Work Under Review            [ disputed ]
    [ work_submitted ]                  │
             │                          │ Arbiter intervention
             │ Client approves          ▼
             ▼                   [ refunded / settled ]
 4. Payout Dispatched
    [ completed ]

```

1. **Phase 1: Deposit Initialization (`awaiting_deposit`)**

   * The client accepts a proposal. The backend generates a unique reference (`muday-[contractId]-[timestamp]`) and creates a localized checkout session via Chapa or Telebirr.

2. **Phase 2: Verified Funding (`funded`)**

   * The client completes payment via mobile wallet or debit card.

   * The payment gateway transmits an asynchronous webhook payload to the backend.

   * The backend validates the `x-chapa-signature` header using HMAC-SHA256 hashing.

   * Upon successful verification, the contract state transitions to `funded`. The freelancer receives automated notification that work can safely commence.

3. **Phase 3: Deliverable Submission (`work_submitted`)**

   * The freelancer uploads proof of work (repository link, design prototype, or document URL).

   * A 72-hour review window opens for client inspection.

4. **Phase 4: Approval & Settlement (`completed`)**

   * The client inspects the deliverables and triggers release.

   * The backend executes an automated B2B payout transfer to the freelancer’s registered Telebirr account for the net amount (`freelancer_net_etb`), retaining the 7% fee in the platform merchant balance.

5. **Phase 5: Dispute Safeguard (`disputed`)**

   * If either party reports non-compliance, funds remain frozen in escrow.

   * An administrative arbiter reviews project logs, deliverables, and briefs to authorize a release, partial settlement, or complete refund.

## 5. UI/UX Design System Specification

### 5.1 Color Tokens & Brand Palette

The visual design combines high-contrast dark-mode styling (popular in technology and cybersecurity tools) with warm Ethiopian cultural ochre accents derived from the traditional *Muday* basket.

| Token Identifier | Hex Code | Visual & Semantic Role | 
| ----- | ----- | ----- | 
| **Canvas Background** | `#0B0F17` | Neutral 950 deep midnight; reduces power draw and eye strain on OLED displays. | 
| **Card Surface** | `#111827` | Neutral 900 elevated surface for distinct visual grouping and contrast. | 
| **Dividers & Borders** | `#1F2937` | Low-profile containment lines separating content blocks cleanly. | 
| **Primary Accent** | `#F59E0B` | Muday Ochre Gold; calls out primary action triggers, buttons, and rates. | 
| **Accent Hover** | `#D97706` | Deepened ochre for interactive pointer, hover, and tap states. | 
| **Escrow Green** | `#10B981` | Emerald green; signals trust, locked funds, and successful completion. | 
| **Dispute Red** | `#EF4444` | Warning highlights, active dispute indicators, and error banners. | 
| **Muted Text** | `#9CA3AF` | Secondary body text, timestamps, and metadata tags. | 

### 5.2 Typography System

* **Primary Latin Font:** Inter or system-ui sans-serif for clean interface legibility.

* **Ethiopic Script Font:** Nyala or Noto Sans Ethiopic for localized Amharic headers, tooltips, and legal microcopy.

* **Hierarchy:**

  * Heading 1: 24px–32px Bold (`text-2xl` to `text-3xl font-bold tracking-tight`)

  * Heading 2: 18px–20px Semi-Bold (`text-lg` to `text-xl font-semibold`)

  * Body Text: 14px–16px Regular (`text-sm` to `text-base text-gray-300`)

  * Captions & Badges: 11px–12px Medium (`text-xs font-medium uppercase tracking-wider`)

## 6. Frontend View & Component Specifications

### 6.1 Top Navigation Bar (`Navbar`)

* **Purpose:** Provides brand consistency, quick navigation, account switcher, and bilingual context.

* **Layout Requirements:**

  * Left: Brand logo icon (container with gradient fill) paired with dual-script brand typography ("MudayHub / ሙዳይ ሀብ").

  * Center: Core navigation links (Gig directory, Escrow security guarantees, How it Works).

  * Right: Action triggers ("Post a Job" primary CTA, notification bell, profile/wallet dropdown).

* **Behavior:** Sticky top position with background blur (`backdrop-blur-md`) and responsive collapse for mobile screens.

### 6.2 Marketplace Job Card (`JobCard`)

* **Purpose:** Surfaces actionable gig details to talent browsing the feed without visual clutter.

* **Layout Requirements:**

  * Header: Job title aligned left with an "Escrow Verified" badge pinned to the right.

  * Body: Two-line clamped project overview detailing technical requirements.

  * Tags: Skill badges rendered as rounded low-contrast pills.

  * Footer: Prominent ETB budget figure in brand ochre paired with an immediate "Send Proposal" action button.

* **Interaction:** Hover transitions highlighting the border with a subtle ochre glow.

### 6.3 Escrow Transaction & Work Review Room (`EscrowContractView`)

* **Purpose:** The centralized transaction workspace where both parties review contract progress and manage deliverables and funds.

* **Layout Requirements:**

  * Top Ribbon: Contract UUID, total escrow balance locked, and client/freelancer identities.

  * Stepper Module: Four-stage progressive breadcrumb tracker:

    1. *Deposit Funds*

    2. *In Progress (Protected)*

    3. *Work Review*

    4. *Released to Telebirr*

  * Dynamic Action Canvas (Context-Aware):

    * *If Freelancer & Funded:* Input form for repository/deliverable URL submission.

    * *If Client & Work Submitted:* Dual button split ("Raise Dispute" in warning red vs. "Approve & Release Funds" in emerald green).

    * *If Completed:* Success banner with Telebirr confirmation receipt details.

    * *If Disputed:* Prominent arbitration notice with an active case ID.

  * Security Footnote: Informational disclaimer highlighting legal protections under Ethiopian commercial arbitration frameworks.

## 7. Anti-Disintermediation & Platform Governance

To prevent users from circumventing the platform after discovering each other (thereby avoiding escrow protections and platform fees), MudayHub deploys three enforcement vectors:

1. **Automated Communication Screening:** Pre-contract messaging channels employ pattern filters to flag and redact raw phone numbers, Telegram usernames (`@...`), and external payment handles until an initial project escrow milestone has been funded.

2. **Reputation & Milestone Capital:** Freelancer profile rank, tier progression, and public rating scores depend entirely on payments settled via the automated escrow pipeline. Off-platform engagements produce zero verifiable platform reputation.

3. **Enterprise Incentive Alignment:** High-budget enterprise contracts and institutional projects are exclusively routed to accounts in the upper verification tiers with proven on-platform delivery records.

## 8. Go-To-Market & Deployment Plan

### Phase 1: DNS & Local Domain Configuration

* Register and point the official `mudayhub.et` primary domain from the Ethio telecom portal to CDN edge hosting (Vercel / Render).

* Configure Cloudflare Email Routing for official platform communications (`contact@mudayhub.et`, `support@mudayhub.et`).

### Phase 2: Payment Sandbox Verification

* Conduct end-to-end sandbox simulations with Chapa and Telebirr developer environments.

* Verify webhook signature validation (`x-chapa-signature`) against replay attacks and edge-case payload tampering.

### Phase 3: Targeted Supply Seeding

* Onboard an initial cohort of 30 to 50 vetted local developers, penetration testers, and UI/UX designers.

* Offer a zero-percent (0%) platform fee incentive for each professional's first three successfully settled contracts.

### Phase 4: Demand Acquisition & Scale

* Partner with local tech incubators, software training academies, and university hackathons to position MudayHub Freelance as the standard domestic contracting engine.