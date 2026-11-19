-- MudayHub Freelance — 007 milestones and multi-track payment ledger
-- Apply after 001-006. Adds phased milestone escrow support, milestone
-- progress state machine, and double-entry payment ledger.

-- ════════════════════════════════════════════════════════════════
-- 1) Milestones table
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 1),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 140),
  description TEXT NOT NULL DEFAULT '',
  amount_etb NUMERIC(12,2) NOT NULL CHECK (amount_etb > 0),
  due_days INTEGER NOT NULL DEFAULT 7 CHECK (due_days > 0),
  status TEXT NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'funded', 'work_submitted', 'completed', 'disputed', 'refunded')),
  submission_url TEXT,
  submission_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT milestones_contract_ordinal_unique UNIQUE (contract_id, ordinal)
);

CREATE INDEX IF NOT EXISTS milestones_contract_idx ON public.milestones(contract_id);
CREATE INDEX IF NOT EXISTS milestones_status_idx ON public.milestones(status);

-- ════════════════════════════════════════════════════════════════
-- 2) Double-entry Payment Ledger table
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payout_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL
    CHECK (entry_type IN ('deposit', 'escrow_lock', 'platform_fee', 'freelancer_payout', 'refund')),
  amount_etb NUMERIC(12,2) NOT NULL CHECK (amount_etb > 0),
  currency TEXT NOT NULL DEFAULT 'ETB',
  provider TEXT NOT NULL,
  provider_reference TEXT,
  destination_account TEXT,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payout_ledger_contract_idx ON public.payout_ledger(contract_id);
CREATE INDEX IF NOT EXISTS payout_ledger_milestone_idx ON public.payout_ledger(milestone_id);
CREATE INDEX IF NOT EXISTS payout_ledger_created_at_idx ON public.payout_ledger(created_at DESC);

-- ════════════════════════════════════════════════════════════════
-- 3) Auto-update timestamp trigger
-- ════════════════════════════════════════════════════════════════
CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 4) Row-Level Security for Milestones and Payout Ledger
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_ledger ENABLE ROW LEVEL SECURITY;

-- Milestones: Readable by contract participants and admins
CREATE POLICY milestones_select_parties ON public.milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = milestones.contract_id
        AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid() OR public.is_admin())
    )
  );

-- Milestone mutations must go through service-role/admin functions
CREATE POLICY milestones_admin_all ON public.milestones
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Payout ledger: Readable by contract participants and admins
CREATE POLICY payout_ledger_select_parties ON public.payout_ledger
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = payout_ledger.contract_id
        AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid() OR public.is_admin())
    )
  );

-- Service-role writes to payout_ledger (no direct public INSERT policy)
CREATE POLICY payout_ledger_admin_all ON public.payout_ledger
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());
