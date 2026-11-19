# MudayHub (ሙዳይ ሀብ) — System Architecture & Product Blueprint

> **High-Trust Digital Services Marketplace & Programmatic Escrow Operating System for Ethiopia.**

---

## 1. Executive Summary & Brand Heritage

**MudayHub (ሙዳይ ሀብ)** is a decentralized, high-trust digital marketplace engineered for the Ethiopian tech ecosystem. It connects local software engineers, cybersecurity specialists, UI/UX designers, translators, and creative professionals with Ethiopian startups, SMEs, and enterprise clients.

### The Muday (ሙዳይ) Heritage & Metaphor
In Ethiopian heritage, a **Muday (ሙዳይ)** is a traditionally hand-woven container used to store precious treasures, savings, and family valuables with honor and safety. 

MudayHub adapts this timeless concept to the digital economy:
* Acting as a **cryptographic escrow vault** that secures project funds in domestic currency (ETB) before work begins.
* Eliminating non-payment fraud, ghosting, and deliverable theft without relying on inaccessible international payment rails (PayPal, Payoneer).

---

## 2. The Dual-Marketplace Engine

MudayHub avoids the bloat, spam bidding, and fee exploitation of global platforms (Upwork, Fiverr) while unifying the best of both interaction models into a streamlined experience:

```
                                  [ MudayHub Engine ]
                                          |
                +-------------------------+-------------------------+
                |                                                   |
      [ Ready Services Catalog ]                           [ Project Requests ]
      (Pre-Packaged Instant Hire)                          (Custom Scoped Work)
                |                                                   |
   - 3 Fixed Tiers (Basic/Std/VIP)                     - 3-Step Guided Brief
   - Upfront ETB pricing & timeline                    - Verified specialist solutions
   - Instant 60s escrow checkout                       - Milestone-based deliverables
                |                                                   |
                +-------------------------+-------------------------+
                                          |
                                          v
                         [ Programmatic Escrow Protocol ]
                          (Telebirr & CBE Birr Native)
```

### 2.1 Ready Services (Instant Hire)
* **What it is:** Fixed-deliverable solutions published by verified specialists (e.g., *"Amharic Mobile UI Design"*, *"Telebirr Payment API Integration"*, *"Security Vulnerability Audit"*).
* **Pricing Model:** 3 distinct transparent tiers (**Basic**, **Standard**, **Premium**) specifying clear turnaround days and revision rounds.
* **Client Value:** Fast 60-second booking directly into escrow without back-and-forth negotiation.

### 2.2 Custom Project Requests (Tailored Solutions)
* **What it is:** Flexible engagements for full-scale software development, ongoing enterprise retainers, and unique business needs.
* **Client Experience:** Simple 3-question guided brief (Scope, Budget in ETB, Deadline) without bureaucratic RFP forms.
* **Specialist Value:** Direct proposals with estimated delivery days and cover pitches.

---

## 3. Strict Role Separation (Client vs. Specialist)

To eliminate confusion, the platform strictly isolates the navigation, dashboards, and permissions for each role:

### 3.1 The Client Role (Hiring Entity / Enterprise)
* **Top Navigation:** `Services` · `Projects` · `Talent` · `Workspace`
* **Primary Call-to-Action:** `+ Post Project Request`
* **Dashboard Capabilities:**
  * View active contracts and escrow rooms.
  * Manage posted project requests and monitor incoming applicant counts.
  * Review proposals with specialist avatars, ratings, and one-click **"Accept & Fund Escrow"** actions.
  * Edit **Organization Profile** (Business Name, Contact Phone, Industry Bio) — *no freelancer skills or payout account prompts*.
* **Public Profile View:**
  * Labeled **"Hiring Entity · Verified Client"**.
  * Shows business overview, funded engagements count, and an **"Open Project Requests"** tab so specialists can apply directly.
  * Hides all freelancer-specific UI elements.

### 3.2 The Specialist Role (Freelancer / Technical Talent)
* **Top Navigation:** `Find Projects` · `Services` · `My Bids` · `Workspace`
  * **Note:** The *"Talent"* tab is hidden for specialists, as freelancers look for client projects to work on, not other talent to hire.
* **Primary Call-to-Action:** `+ Offer a Service`
* **Dashboard Capabilities:**
  * Track active deliverables and open escrow chat rooms.
  * Publish and manage 3-tier service offerings.
  * Monitor submitted bid statuses (Under Review, Accepted, Not Selected).
  * Configure **Telebirr Payout Wallet** (`+251...`) for automated releases.
  * Manage verified **Technical Competencies** (React, Next.js, Flutter, Telebirr API, Figma).
* **Public Profile View:**
  * Labeled **"Verified Remote Specialist"** with star rating and completed escrow track record.
  * Shows technical skill badges, client reviews, and an **"Offered Services"** catalog tab.

---

## 4. Modern Vertical Tabs Architecture

All primary workflow pages utilize a **modern vertical tabs layout** (desktop sidebar navigation with active glow and count badges, collapsing smoothly on mobile) rather than legacy horizontal underline tabs:

### 4.1 Proposals Hub (`app/proposals/page.tsx`)
* **Left Vertical Tab Bar:**
  * `All Proposals [Count]`
  * `Under Review / Awaiting Decision [Count]`
  * `Accepted & Awarded [Count]`
  * `Not Selected [Count]`
* **Right Content Pane:** Real-time proposal cards displaying applicant details, proposed bids, and turnaround days.

### 4.2 Public Profile (`app/profiles/[id]/page.tsx`)
* **Left Vertical Tab Bar:**
  * For Specialists: `Offered Services [Count]` · `Escrow Reviews [Count]`
  * For Clients: `Open Project Briefs [Count]` · `Escrow Reviews [Count]`
* **Right Content Pane:** Responsive grid displaying service packages, project listings, or authenticated star ratings.

### 4.3 Workspace Contracts (`app/contracts/page.tsx`)
* **Left Vertical Tab Bar:**
  * `All Contracts [Count]`
  * `Active Escrows [Count]`
  * `Completed [Count]`
* **Right Content Pane:** Milestone escrow engagements with real-time status indicators.

---

## 5. Programmatic Escrow State Machine

```
 [ awaiting_deposit ]
         |
         | (Telebirr / Chapa HMAC-signed checkout webhook)
         v
     [ funded ] -----------------------------------+
         |                                         |
         | (Specialist delivers work & repository) | (Dispute raised)
         v                                         v
 [ work_submitted ]                          [ disputed ]
         |                                         |
         +-------------------+                     | (Arbiter ruling)
         |                   |                     v
         v                   v            [ refunded / released ]
   (Client approves)   (Client requests revision)
         |                   |
         v                   +---> [ funded (revision) ]
   [ completed ]
         |
         +---> (Automated payout: 93% to Specialist Telebirr wallet, 7% platform retention)
```

### Escrow Invariants
1. **Frontend Isolation:** The client browser never mutates financial state or transitions contract statuses directly.
2. **Deterministic Fee Split:** Fixed 7% platform fee retained at completion; 93% net disbursed to the specialist's Telebirr wallet.
3. **100% ETB Settlement:** Local currency transactions native to Telebirr and CBE Birr with zero foreign exchange friction.

---

## 6. Directory Structure & Key Files

```
MudayHub-Freelance/
├── app/
│   ├── page.tsx                     # Landing hero with Aurora glow & category dropdown
│   ├── not-found.tsx                # Custom MudayHub 404 page
│   ├── dashboard/page.tsx           # Role-separated client/specialist hub
│   ├── proposals/page.tsx           # Vertical tabbed proposal review center
│   ├── contracts/page.tsx           # Vertical tabbed workspace contracts
│   ├── contracts/[id]/page.tsx      # Secure escrow collaboration room
│   ├── profiles/[id]/page.tsx       # Vertical tabbed client & specialist profiles
│   ├── gigs/page.tsx                # Services catalog with category dropdown
│   ├── gigs/new/page.tsx            # 3-tier service publisher
│   ├── jobs/page.tsx                # Open project briefs marketplace
│   ├── jobs/new/page.tsx            # 3-step project request wizard
│   ├── jobs/[id]/page.tsx           # Project brief & proposal bidding room
│   ├── talent/page.tsx              # Verified Ethiopian specialist directory
│   └── api/
│       ├── gigs/                    # Service packages CRUD & ordering
│       ├── jobs/                    # Project briefs with client_id filtering
│       ├── proposals/               # Role-scoped proposal query & submissions
│       ├── contracts/               # Escrow contract ledger
│       └── escrow/                  # Checkout, webhooks, work submission, release
├── components/
│   ├── Navbar.tsx                   # Role-aware responsive navigation
│   ├── Footer.tsx                   # Marketplace category navigation
│   ├── GigCard.tsx                  # Service package card
│   ├── JobCard.tsx                  # Project request card ("View Project")
│   └── SessionProvider.tsx          # Authentication & demo mode context
├── lib/
│   ├── types.ts                     # Core TypeScript entities & state types
│   ├── utils.ts                     # ETB currency formatting & relative timers
│   └── demo/
│       ├── store.ts                 # Local sandbox mock database
│       └── mode.ts                  # Hybrid Supabase / demo mode switcher
└── MUDAYHUB_SYSTEM_ARCHITECTURE.md  # This document
```

---

## 7. Technology Stack

* **Framework:** Next.js 15 (App Router with TypeScript)
* **Styling:** Tailwind CSS with custom glassmorphism, Aurora glow gradients, and Ge'ez typography support
* **Icons:** Lucide React
* **Backend Rails:** Next.js Server Components, Server Actions & Route Handlers
* **Database & Auth:** Supabase PostgreSQL with Row-Level Security (RLS) + Local Demo Store fallback
* **Payment Gateways:** Telebirr B2B Webhook integration + CBE Birr / Chapa Aggregator
