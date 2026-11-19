-- MudayHub Freelance - Migration 012
-- Arbitration 2.0 (Split Settlement & Taxonomy), Worklogs Feed & Cryptographic Trust Deeds

-- 1. Upgrade disputes table
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other'
    CHECK (category IN ('missed_deadline', 'scope_creep', 'quality_mismatch', 'unresponsive', 'breach_of_terms', 'other')),
  ADD COLUMN IF NOT EXISTS evidence_notes TEXT,
  ADD COLUMN IF NOT EXISTS outcome TEXT
    CHECK (outcome IN ('release', 'refund', 'split')),
  ADD COLUMN IF NOT EXISTS split_pct INTEGER
    CHECK (split_pct >= 1 AND split_pct <= 99),
  ADD COLUMN IF NOT EXISTS freelancer_payout_etb NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS client_refund_etb NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id);

-- 2. Add deed_hash to contracts
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS deed_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_contracts_deed_hash ON contracts(deed_hash);

-- 3. Create worklogs table for intermediate progress checkpoints
CREATE TABLE IF NOT EXISTS worklogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hours_spent NUMERIC(5,2),
  deliverable_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'approved', 'needs_revision')),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worklogs_contract ON worklogs(contract_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_milestone ON worklogs(milestone_id);

-- 4. Create trust_deeds table for immutable verifiable trust ledger
CREATE TABLE IF NOT EXISTS trust_deeds (
  id TEXT PRIMARY KEY,
  deed_hash TEXT UNIQUE NOT NULL,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  gig_id TEXT REFERENCES gigs(id) ON DELETE SET NULL,
  project_title TEXT NOT NULL,
  category TEXT NOT NULL,
  freelancer_id UUID NOT NULL REFERENCES auth.users(id),
  freelancer_name TEXT NOT NULL,
  client_name TEXT,
  amount_etb NUMERIC(12,2) NOT NULL,
  platform_fee_etb NUMERIC(12,2) NOT NULL,
  milestone_count INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signature TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trust_deeds_hash ON trust_deeds(deed_hash);
CREATE INDEX IF NOT EXISTS idx_trust_deeds_freelancer ON trust_deeds(freelancer_id);

-- 5. Row Level Security (RLS)
ALTER TABLE worklogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_deeds ENABLE ROW LEVEL SECURITY;

-- Worklogs: accessible to contract participants and admins
CREATE POLICY "Worklogs visible to contract participants" ON worklogs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = worklogs.contract_id
      AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

CREATE POLICY "Worklogs insertable by contract participants" ON worklogs
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = worklogs.contract_id
      AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

-- Trust Deeds: public read-only verification registry
CREATE POLICY "Trust deeds are publicly readable" ON trust_deeds
  FOR SELECT USING (true);
