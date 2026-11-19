-- MudayHub Freelance — core schema + RLS (docs §3)

-- Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'freelancer', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE escrow_status AS ENUM (
    'awaiting_deposit',
    'funded',
    'work_submitted',
    'completed',
    'disputed',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'freelancer',
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  bio TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  telebirr_number TEXT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT phone_et_format CHECK (
    phone IS NULL OR phone ~ '^\+251[97][0-9]{8}$'
  )
);

CREATE INDEX profiles_role_idx ON profiles(role);
CREATE INDEX profiles_skills_idx ON profiles USING GIN(skills);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_etb NUMERIC(12,2) NOT NULL CHECK (budget_etb >= 100),
  status job_status NOT NULL DEFAULT 'open',
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_client_idx ON jobs(client_id);
CREATE INDEX jobs_category_idx ON jobs(category);

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bid_amount_etb NUMERIC(12,2) NOT NULL CHECK (bid_amount_etb >= 50),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  cover_letter TEXT NOT NULL,
  status proposal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, freelancer_id)
);

CREATE INDEX IF NOT EXISTS proposals_job_idx ON proposals(job_id);
CREATE INDEX IF NOT EXISTS proposals_freelancer_idx ON proposals(freelancer_id);

-- Contracts / Escrow
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  total_amount_etb NUMERIC(12,2) NOT NULL CHECK (total_amount_etb > 0),
  platform_fee_etb NUMERIC(12,2) NOT NULL CHECK (platform_fee_etb >= 0),
  freelancer_net_etb NUMERIC(12,2) NOT NULL CHECK (freelancer_net_etb >= 0),
  escrow_status escrow_status NOT NULL DEFAULT 'awaiting_deposit',
  payment_reference TEXT UNIQUE,
  work_submission_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contracts_client_idx ON contracts(client_id);
CREATE INDEX IF NOT EXISTS contracts_freelancer_idx ON contracts(freelancer_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx ON contracts(escrow_status);

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status dispute_status NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS disputes_status_idx ON disputes(status);
CREATE INDEX IF NOT EXISTS disputes_contract_idx ON disputes(contract_id);

-- Contract messages (anti-disintermediation)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_contract_idx ON messages(contract_id, created_at);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, read, created_at DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'freelancer'),
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contracts_updated_at ON contracts;
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS disputes_updated_at ON disputes;
CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: public read; owner update
CREATE POLICY profiles_select_public ON profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Jobs: open jobs public; clients manage own
CREATE POLICY jobs_select_open_or_party ON jobs
  FOR SELECT USING (
    status = 'open'
    OR client_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.job_id = jobs.id AND p.freelancer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.job_id = jobs.id
        AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

CREATE POLICY jobs_insert_client ON jobs
  FOR INSERT WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('client', 'admin'))
  );

CREATE POLICY jobs_update_own ON jobs
  FOR UPDATE USING (auth.uid() = client_id OR public.is_admin())
  WITH CHECK (auth.uid() = client_id OR public.is_admin());

CREATE POLICY jobs_delete_own ON jobs
  FOR DELETE USING (auth.uid() = client_id OR public.is_admin());

-- Proposals: private to freelancer + job client
CREATE POLICY proposals_select_parties ON proposals
  FOR SELECT USING (
    freelancer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM jobs j WHERE j.id = proposals.job_id AND j.client_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY proposals_insert_freelancer ON proposals
  FOR INSERT WITH CHECK (
    auth.uid() = freelancer_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('freelancer', 'admin'))
  );

CREATE POLICY proposals_update_parties ON proposals
  FOR UPDATE USING (
    freelancer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM jobs j WHERE j.id = proposals.job_id AND j.client_id = auth.uid())
    OR public.is_admin()
  );

-- Contracts: parties + admin read; NO client inserts/updates of financial fields via RLS
-- Inserts/status mutations happen via service role (escrow API)
CREATE POLICY contracts_select_parties ON contracts
  FOR SELECT USING (
    client_id = auth.uid()
    OR freelancer_id = auth.uid()
    OR public.is_admin()
  );

-- Allow clients to set work_submission_url is NOT allowed; freelancers may update only work_submission_url via API.
-- Direct client UPDATE blocked except nothing financial — we deny all UPDATE from anon/authenticated;
-- escrow service uses service role.

CREATE POLICY contracts_no_client_update ON contracts
  FOR UPDATE USING (false);

CREATE POLICY contracts_no_client_insert ON contracts
  FOR INSERT WITH CHECK (false);

-- Disputes
CREATE POLICY disputes_select_parties ON disputes
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = disputes.contract_id
        AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

CREATE POLICY disputes_insert_party ON disputes
  FOR INSERT WITH CHECK (
    raised_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
        AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

CREATE POLICY disputes_update_admin ON disputes
  FOR UPDATE USING (public.is_admin());

-- Messages: contract parties only
CREATE POLICY messages_select_parties ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = messages.contract_id
        AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
    OR public.is_admin()
  );

CREATE POLICY messages_insert_parties ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
        AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

-- Notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY notifications_insert_service ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Realtime publications (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'contracts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
  END IF;
END $$;
-- MudayHub Freelance — 002 production hardening
-- Applies ON TOP of 001_initial_schema.sql. Run 001 first, then this.
--
-- Fixes:
--   1. Self-privilege-escalation on profiles (role / is_verified / rating)
--   2. Signup metadata could create role='admin' users
--   3. Atomic proposal-accept → contract-creation (single Postgres transaction)
--
-- ════════════════════════════════════════════════════════════════
-- 1) Profile privileged columns are system-managed.
--    Service-role (auth.uid() = NULL) writes are unaffected.
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_cols()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
       OR NEW.rating IS DISTINCT FROM OLD.rating THEN
      RAISE EXCEPTION 'role, is_verified and rating are system-managed';
    END IF;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS profiles_guard_privileged ON public.profiles;
CREATE TRIGGER profiles_guard_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_cols();

-- ════════════════════════════════════════════════════════════════
-- 2) Signup trigger: only 'client' or 'freelancer' may be granted
--    from user-controlled metadata. 'admin' is never self-service.
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      CASE
        WHEN NEW.raw_user_meta_data->>'role' IN ('client', 'freelancer')
          THEN NEW.raw_user_meta_data->>'role'
      END,
      'freelancer'
    )::user_role,
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END
$$;

-- Admins are provisioned out-of-band (SQL editor / dashboard), never via signup.
-- Promote a trusted user with:
--   UPDATE profiles SET role = 'admin' WHERE email = '<you>'; -- (join with auth.users by id)

-- ════════════════════════════════════════════════════════════════
-- 3) Atomic accept: proposal flip + sibling rejections + job flip +
--    contract creation + notifications in ONE transaction.
--    EXECUTE is revoked from anon/authenticated — only service_role.
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.accept_proposal(p_proposal UUID, p_actor UUID)
RETURNS public.contracts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal public.proposals;
  v_job      public.jobs;
  v_contract public.contracts;
  v_fee      NUMERIC(12,2);
BEGIN
  IF p_actor IS NULL THEN
    RAISE EXCEPTION 'p_actor required';
  END IF;

  SELECT * INTO v_proposal FROM proposals WHERE id = p_proposal FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;
  IF v_proposal.status <> 'pending' THEN
    RAISE EXCEPTION 'Proposal already handled';
  END IF;

  SELECT * INTO v_job FROM jobs WHERE id = v_proposal.job_id FOR UPDATE;
  IF v_job.status <> 'open' THEN
    RAISE EXCEPTION 'Job is not open';
  END IF;

  IF v_job.client_id <> p_actor
     AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_actor AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE proposals SET status = 'accepted' WHERE id = v_proposal.id;
  UPDATE proposals SET status = 'rejected'
   WHERE job_id = v_job.id AND id <> v_proposal.id AND status = 'pending';
  UPDATE jobs SET status = 'in_progress' WHERE id = v_job.id;

  v_fee := round(v_proposal.bid_amount_etb * 0.07, 2);
  INSERT INTO contracts (
    job_id, proposal_id, client_id, freelancer_id,
    total_amount_etb, platform_fee_etb, freelancer_net_etb,
    escrow_status, payment_reference
  ) VALUES (
    v_job.id, v_proposal.id, v_job.client_id, v_proposal.freelancer_id,
    v_proposal.bid_amount_etb,
    v_fee,
    round(v_proposal.bid_amount_etb - v_fee, 2),
    'awaiting_deposit',
    'muday-' || gen_random_uuid() || '-' || floor(extract(epoch from now()) * 1000)
  ) RETURNING * INTO v_contract;

  INSERT INTO notifications (user_id, title, body, link) VALUES
    (v_contract.freelancer_id, 'Proposal accepted', 'Waiting for client escrow deposit.', '/contracts/' || v_contract.id),
    (v_contract.client_id,     'Contract created',   'Deposit funds to unlock protected work.', '/contracts/' || v_contract.id);

  RETURN v_contract;
END
$$;

REVOKE EXECUTE ON FUNCTION public.accept_proposal(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_proposal(UUID, UUID) TO service_role;
-- MudayHub Freelance — 003 profile privacy
-- Public discovery must never expose a member's phone or payout destination.

DROP POLICY IF EXISTS profiles_select_public ON public.profiles;

CREATE POLICY profiles_select_self_or_admin ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- A deliberately narrow directory function. SECURITY DEFINER allows public
-- marketplace pages to read only the fields listed here while the base table
-- remains restricted to its owner and administrators.
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_ids UUID[])
RETURNS TABLE (
  id UUID,
  role public.user_role,
  full_name TEXT,
  bio TEXT,
  skills TEXT[],
  rating NUMERIC,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.role, p.full_name, p.bio, p.skills, p.rating,
         p.is_verified, p.created_at
  FROM public.profiles p
  WHERE p_ids IS NULL OR p.id = ANY(p_ids);
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(UUID[]) TO anon, authenticated;
-- MudayHub Freelance — 004 marketplace integrity
-- Apply after 001, 002, and 003. This migration adds the production tables
-- used by the application and moves business-critical changes into audited,
-- atomic database functions.

CREATE TABLE IF NOT EXISTS gigs (
  id TEXT PRIMARY KEY,
  freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 140),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category TEXT NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 30 AND 10000),
  cover_image TEXT NOT NULL DEFAULT '',
  gallery TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  packages JSONB NOT NULL,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1 AND rating <= 5),
  reviews_count INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  orders_completed INTEGER NOT NULL DEFAULT 0 CHECK (orders_completed >= 0),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gigs_packages_shape CHECK (
    packages ? 'basic' AND packages ? 'standard' AND packages ? 'premium'
  )
);

CREATE INDEX IF NOT EXISTS gigs_freelancer_idx ON public.gigs(freelancer_id);
CREATE INDEX IF NOT EXISTS gigs_category_idx ON public.gigs(category) WHERE is_published;

ALTER TABLE public.contracts ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE public.contracts ALTER COLUMN proposal_id DROP NOT NULL;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS gig_id TEXT REFERENCES public.gigs(id) ON DELETE RESTRICT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS package_tier TEXT CHECK (package_tier IN ('basic', 'standard', 'premium'));
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS requirements TEXT NOT NULL DEFAULT '';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS work_submission_notes TEXT;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_one_source_check CHECK (
  (job_id IS NOT NULL AND proposal_id IS NOT NULL AND gig_id IS NULL AND package_tier IS NULL)
  OR
  (job_id IS NULL AND proposal_id IS NULL AND gig_id IS NOT NULL AND package_tier IS NOT NULL)
) NOT VALID;
ALTER TABLE public.contracts VALIDATE CONSTRAINT contracts_one_source_check;
CREATE INDEX IF NOT EXISTS contracts_gig_idx ON public.contracts(gig_id);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  gig_id TEXT REFERENCES public.gigs(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(comment) BETWEEN 3 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reviews_distinct_people CHECK (author_id <> target_id),
  CONSTRAINT reviews_one_per_author_contract UNIQUE (contract_id, author_id)
);
CREATE INDEX IF NOT EXISTS reviews_target_idx ON public.reviews(target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_gig_idx ON public.reviews(gig_id, created_at DESC);

DO $$ BEGIN
  CREATE TYPE payment_operation_kind AS ENUM ('deposit', 'payout', 'refund');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE payment_operation_status AS ENUM ('pending', 'succeeded', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS payment_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
  kind payment_operation_kind NOT NULL,
  status payment_operation_status NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL,
  provider_reference TEXT UNIQUE,
  amount_etb NUMERIC(12,2) NOT NULL CHECK (amount_etb > 0),
  destination TEXT,
  idempotency_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS payment_operations_one_pending_per_kind
  ON public.payment_operations(contract_id, kind) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS payment_operations_contract_idx ON public.payment_operations(contract_id, created_at DESC);

CREATE TABLE IF NOT EXISTS contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS contract_events_contract_idx ON public.contract_events(contract_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS gigs_updated_at ON public.gigs;
CREATE TRIGGER gigs_updated_at BEFORE UPDATE ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Members may only amend an unpublished/no-bid job. Financial and lifecycle
-- changes are made by service functions below.
DROP POLICY IF EXISTS jobs_update_own ON public.jobs;
DROP POLICY IF EXISTS jobs_delete_own ON public.jobs;
CREATE POLICY jobs_update_open_without_proposals ON public.jobs FOR UPDATE
  USING (
    auth.uid() = client_id AND status = 'open'
    AND NOT EXISTS (SELECT 1 FROM public.proposals p WHERE p.job_id = jobs.id)
  )
  WITH CHECK (auth.uid() = client_id AND status = 'open');
CREATE POLICY jobs_delete_open_without_proposals ON public.jobs FOR DELETE
  USING (
    auth.uid() = client_id AND status = 'open'
    AND NOT EXISTS (SELECT 1 FROM public.proposals p WHERE p.job_id = jobs.id)
  );

-- Proposal status and pricing are immutable after creation. Acceptance is only
-- possible through accept_proposal(), which is service-role-only.
DROP POLICY IF EXISTS proposals_update_parties ON public.proposals;

ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY gigs_select_published_or_owner ON public.gigs FOR SELECT USING (
  is_published OR freelancer_id = auth.uid() OR public.is_admin()
);
CREATE POLICY gigs_insert_owner ON public.gigs FOR INSERT WITH CHECK (
  freelancer_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('freelancer', 'admin'))
);
CREATE POLICY gigs_update_owner ON public.gigs FOR UPDATE USING (
  freelancer_id = auth.uid() OR public.is_admin()
) WITH CHECK (freelancer_id = auth.uid() OR public.is_admin());
CREATE POLICY gigs_delete_owner_without_contracts ON public.gigs FOR DELETE USING (
  (freelancer_id = auth.uid() OR public.is_admin())
  AND NOT EXISTS (SELECT 1 FROM public.contracts c WHERE c.gig_id = gigs.id)
);
CREATE POLICY reviews_select_public ON public.reviews FOR SELECT USING (true);
CREATE POLICY payment_operations_select_parties ON public.payment_operations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = payment_operations.contract_id
    AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY contract_events_select_parties ON public.contract_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_events.contract_id
    AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid() OR public.is_admin()))
);

CREATE OR REPLACE FUNCTION public.log_contract_event(
  p_contract UUID, p_actor UUID, p_event TEXT, p_data JSONB DEFAULT '{}'::jsonb
) RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.contract_events(contract_id, actor_id, event_type, data)
  VALUES (p_contract, p_actor, p_event, COALESCE(p_data, '{}'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.order_gig(
  p_gig TEXT, p_tier TEXT, p_actor UUID, p_requirements TEXT DEFAULT ''
) RETURNS public.contracts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_gig public.gigs; v_contract public.contracts; v_amount NUMERIC(12,2); v_fee NUMERIC(12,2);
BEGIN
  IF p_actor IS NULL OR p_tier NOT IN ('basic', 'standard', 'premium') THEN RAISE EXCEPTION 'Invalid order'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor AND role IN ('client', 'admin')) THEN RAISE EXCEPTION 'Only clients can order services'; END IF;
  SELECT * INTO v_gig FROM public.gigs WHERE id = p_gig AND is_published = TRUE FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Service not found'; END IF;
  IF v_gig.freelancer_id = p_actor THEN RAISE EXCEPTION 'Cannot order your own service'; END IF;
  v_amount := NULLIF(v_gig.packages -> p_tier ->> 'price_etb', '')::NUMERIC;
  IF v_amount IS NULL OR v_amount < 50 THEN RAISE EXCEPTION 'Invalid service price'; END IF;
  v_fee := ROUND(v_amount * 0.07, 2);
  INSERT INTO public.contracts (gig_id, package_tier, client_id, freelancer_id, total_amount_etb, platform_fee_etb, freelancer_net_etb, escrow_status, payment_reference, requirements)
  VALUES (v_gig.id, p_tier, p_actor, v_gig.freelancer_id, v_amount, v_fee, ROUND(v_amount - v_fee, 2), 'awaiting_deposit',
    'muday-' || gen_random_uuid() || '-' || FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000), LEFT(COALESCE(p_requirements, ''), 5000))
  RETURNING * INTO v_contract;
  PERFORM public.log_contract_event(v_contract.id, p_actor, 'contract_created', jsonb_build_object('source', 'gig', 'gig_id', v_gig.id, 'tier', p_tier));
  INSERT INTO public.notifications(user_id, title, body, link) VALUES
    (v_contract.freelancer_id, 'New service order', 'Confirm the requirements and await payment availability.', '/contracts/' || v_contract.id),
    (v_contract.client_id, 'Contract created', 'Your service workspace is ready.', '/contracts/' || v_contract.id);
  RETURN v_contract;
END $$;

CREATE OR REPLACE FUNCTION public.submit_contract_work(
  p_contract UUID, p_actor UUID, p_url TEXT, p_notes TEXT DEFAULT ''
) RETURNS public.contracts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contract public.contracts;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.freelancer_id <> p_actor THEN RAISE EXCEPTION 'Only the freelancer can submit work'; END IF;
  IF v_contract.escrow_status <> 'funded' THEN RAISE EXCEPTION 'Contract is not ready for a submission'; END IF;
  IF p_url !~ '^https://[^[:space:]]+$' THEN RAISE EXCEPTION 'A valid HTTPS deliverable URL is required'; END IF;
  UPDATE public.contracts SET work_submission_url = LEFT(p_url, 2000), work_submission_notes = LEFT(COALESCE(p_notes, ''), 5000), escrow_status = 'work_submitted'
    WHERE id = p_contract RETURNING * INTO v_contract;
  PERFORM public.log_contract_event(p_contract, p_actor, 'work_submitted', jsonb_build_object('url', p_url));
  INSERT INTO public.notifications(user_id, title, body, link) VALUES
    (v_contract.client_id, 'Work submitted', 'A deliverable is ready for your review.', '/contracts/' || p_contract);
  RETURN v_contract;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS disputes_one_active_per_contract
  ON public.disputes(contract_id) WHERE status IN ('open', 'under_review');

CREATE OR REPLACE FUNCTION public.raise_contract_dispute(
  p_contract UUID, p_actor UUID, p_reason TEXT, p_evidence TEXT DEFAULT NULL
) RETURNS public.disputes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contract public.contracts; v_dispute public.disputes;
BEGIN
  IF char_length(trim(COALESCE(p_reason, ''))) < 10 THEN RAISE EXCEPTION 'A dispute reason must be at least 10 characters'; END IF;
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF p_actor NOT IN (v_contract.client_id, v_contract.freelancer_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_contract.escrow_status NOT IN ('funded', 'work_submitted') THEN RAISE EXCEPTION 'Contract cannot be disputed in its current state'; END IF;
  UPDATE public.contracts SET escrow_status = 'disputed' WHERE id = p_contract;
  INSERT INTO public.disputes(contract_id, raised_by, reason, evidence_url)
    VALUES (p_contract, p_actor, LEFT(trim(p_reason), 5000), NULLIF(LEFT(COALESCE(p_evidence, ''), 2000), '')) RETURNING * INTO v_dispute;
  PERFORM public.log_contract_event(p_contract, p_actor, 'dispute_raised', jsonb_build_object('dispute_id', v_dispute.id));
  INSERT INTO public.notifications(user_id, title, body, link) VALUES
    (CASE WHEN p_actor = v_contract.client_id THEN v_contract.freelancer_id ELSE v_contract.client_id END,
     'Dispute opened', 'A contract dispute needs your response.', '/contracts/' || p_contract);
  RETURN v_dispute;
END $$;

CREATE OR REPLACE FUNCTION public.submit_review(
  p_contract UUID, p_actor UUID, p_rating INTEGER, p_comment TEXT
) RETURNS public.reviews
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contract public.contracts; v_review public.reviews; v_target UUID;
BEGIN
  IF p_rating NOT BETWEEN 1 AND 5 OR char_length(trim(COALESCE(p_comment, ''))) < 3 THEN RAISE EXCEPTION 'Invalid review'; END IF;
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract FOR UPDATE;
  IF NOT FOUND OR v_contract.escrow_status <> 'completed' THEN RAISE EXCEPTION 'Reviews are available after completion'; END IF;
  IF p_actor NOT IN (v_contract.client_id, v_contract.freelancer_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  v_target := CASE WHEN p_actor = v_contract.client_id THEN v_contract.freelancer_id ELSE v_contract.client_id END;
  INSERT INTO public.reviews(contract_id, author_id, target_id, gig_id, rating, comment)
  VALUES (p_contract, p_actor, v_target, v_contract.gig_id, p_rating, LEFT(trim(p_comment), 2000)) RETURNING * INTO v_review;
  IF v_contract.gig_id IS NOT NULL THEN
    UPDATE public.gigs SET reviews_count = reviews_count + 1,
      rating = ROUND(((rating * reviews_count) + p_rating) / (reviews_count + 1), 2)
    WHERE id = v_contract.gig_id;
  END IF;
  RETURN v_review;
END $$;

-- Browser roles cannot invoke these state-changing functions. Route handlers
-- use the service role only after checking the authenticated actor.
REVOKE ALL ON FUNCTION public.order_gig(TEXT, TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_contract_work(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.raise_contract_dispute(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_review(UUID, UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.order_gig(TEXT, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_contract_work(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.raise_contract_dispute(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_review(UUID, UUID, INTEGER, TEXT) TO service_role;
-- MudayHub Freelance — 005 payment operation integrity
-- Provider calls occur outside Postgres. These functions create an idempotent
-- operation first and finalize the contract only after the provider confirms it.

ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS resolution_outcome TEXT
  CHECK (resolution_outcome IN ('release', 'refund'));
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.profiles(id);

CREATE OR REPLACE FUNCTION public.start_deposit_operation(
  p_contract UUID, p_actor UUID, p_provider TEXT
) RETURNS public.payment_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contract public.contracts; v_operation public.payment_operations;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.client_id <> p_actor THEN RAISE EXCEPTION 'Only the client can fund this contract'; END IF;
  IF v_contract.escrow_status <> 'awaiting_deposit' THEN RAISE EXCEPTION 'Contract is not awaiting payment'; END IF;
  SELECT * INTO v_operation FROM public.payment_operations
    WHERE contract_id = p_contract AND kind = 'deposit' AND status = 'pending' FOR UPDATE;
  IF FOUND THEN RETURN v_operation; END IF;
  INSERT INTO public.payment_operations(contract_id, kind, provider, provider_reference, amount_etb)
  VALUES (p_contract, 'deposit', LEFT(p_provider, 40), v_contract.payment_reference, v_contract.total_amount_etb)
  RETURNING * INTO v_operation;
  PERFORM public.log_contract_event(p_contract, p_actor, 'deposit_started', jsonb_build_object('operation_id', v_operation.id, 'provider', p_provider));
  RETURN v_operation;
END $$;

CREATE OR REPLACE FUNCTION public.start_release_operation(
  p_contract UUID, p_actor UUID, p_provider TEXT, p_destination TEXT
) RETURNS public.payment_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contract public.contracts; v_operation public.payment_operations;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.client_id <> p_actor AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor AND role = 'admin') THEN RAISE EXCEPTION 'Only the client can release this contract'; END IF;
  IF v_contract.escrow_status <> 'work_submitted' THEN RAISE EXCEPTION 'Contract is not ready for release'; END IF;
  IF NULLIF(trim(COALESCE(p_destination, '')), '') IS NULL THEN RAISE EXCEPTION 'Payout destination is missing'; END IF;
  INSERT INTO public.payment_operations(contract_id, kind, provider, amount_etb, destination)
  VALUES (p_contract, 'payout', LEFT(p_provider, 40), v_contract.freelancer_net_etb, LEFT(p_destination, 80))
  RETURNING * INTO v_operation;
  PERFORM public.log_contract_event(p_contract, p_actor, 'payout_started', jsonb_build_object('operation_id', v_operation.id));
  RETURN v_operation;
END $$;

CREATE OR REPLACE FUNCTION public.begin_dispute_review(
  p_dispute UUID, p_actor UUID, p_notes TEXT DEFAULT ''
) RETURNS public.disputes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_dispute public.disputes;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor AND role = 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO v_dispute FROM public.disputes WHERE id = p_dispute FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dispute not found'; END IF;
  IF v_dispute.status = 'resolved' THEN RAISE EXCEPTION 'Dispute is already resolved'; END IF;
  UPDATE public.disputes SET status = 'under_review', resolution_notes = LEFT(COALESCE(p_notes, resolution_notes, ''), 5000)
    WHERE id = p_dispute RETURNING * INTO v_dispute;
  PERFORM public.log_contract_event(v_dispute.contract_id, p_actor, 'dispute_under_review', jsonb_build_object('dispute_id', p_dispute));
  RETURN v_dispute;
END $$;

CREATE OR REPLACE FUNCTION public.start_dispute_resolution_operation(
  p_dispute UUID, p_actor UUID, p_outcome TEXT, p_notes TEXT, p_provider TEXT, p_destination TEXT DEFAULT NULL
) RETURNS public.payment_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_dispute public.disputes; v_contract public.contracts; v_operation public.payment_operations; v_kind payment_operation_kind; v_amount NUMERIC(12,2);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor AND role = 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_outcome NOT IN ('release', 'refund') THEN RAISE EXCEPTION 'Invalid resolution outcome'; END IF;
  SELECT * INTO v_dispute FROM public.disputes WHERE id = p_dispute FOR UPDATE;
  IF NOT FOUND OR v_dispute.status = 'resolved' THEN RAISE EXCEPTION 'Dispute is not available for resolution'; END IF;
  SELECT * INTO v_contract FROM public.contracts WHERE id = v_dispute.contract_id FOR UPDATE;
  IF v_contract.escrow_status <> 'disputed' THEN RAISE EXCEPTION 'Contract is not disputed'; END IF;
  v_kind := CASE WHEN p_outcome = 'release' THEN 'payout'::payment_operation_kind ELSE 'refund'::payment_operation_kind END;
  v_amount := CASE WHEN p_outcome = 'release' THEN v_contract.freelancer_net_etb ELSE v_contract.total_amount_etb END;
  INSERT INTO public.payment_operations(contract_id, kind, provider, amount_etb, destination, metadata)
  VALUES (v_contract.id, v_kind, LEFT(p_provider, 40), v_amount, NULLIF(LEFT(COALESCE(p_destination, ''), 80), ''), jsonb_build_object('dispute_id', p_dispute))
  RETURNING * INTO v_operation;
  UPDATE public.disputes SET status = 'under_review', resolution_notes = LEFT(COALESCE(p_notes, ''), 5000), resolution_outcome = p_outcome, resolved_by = p_actor
    WHERE id = p_dispute;
  PERFORM public.log_contract_event(v_contract.id, p_actor, 'dispute_resolution_started', jsonb_build_object('dispute_id', p_dispute, 'operation_id', v_operation.id, 'outcome', p_outcome));
  RETURN v_operation;
END $$;

CREATE OR REPLACE FUNCTION public.finalize_payment_operation(
  p_operation UUID, p_provider_reference TEXT, p_success BOOLEAN, p_failure_reason TEXT DEFAULT NULL
) RETURNS public.contracts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_operation public.payment_operations; v_contract public.contracts; v_target escrow_status; v_dispute UUID;
BEGIN
  SELECT * INTO v_operation FROM public.payment_operations WHERE id = p_operation FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment operation not found'; END IF;
  SELECT * INTO v_contract FROM public.contracts WHERE id = v_operation.contract_id FOR UPDATE;
  IF v_operation.status = 'succeeded' THEN RETURN v_contract; END IF;
  IF v_operation.status = 'failed' THEN RAISE EXCEPTION 'Payment operation has already failed'; END IF;
  IF NOT p_success THEN
    UPDATE public.payment_operations SET status = 'failed', failure_reason = LEFT(COALESCE(p_failure_reason, 'Provider rejected operation'), 1000), completed_at = NOW()
      WHERE id = p_operation;
    PERFORM public.log_contract_event(v_contract.id, NULL, 'payment_failed', jsonb_build_object('operation_id', p_operation, 'kind', v_operation.kind));
    RETURN v_contract;
  END IF;
  IF NULLIF(trim(COALESCE(p_provider_reference, '')), '') IS NULL THEN RAISE EXCEPTION 'Provider reference is required'; END IF;
  v_target := CASE v_operation.kind
    WHEN 'deposit' THEN 'funded'::escrow_status
    WHEN 'payout' THEN 'completed'::escrow_status
    WHEN 'refund' THEN 'refunded'::escrow_status
  END;
  IF (v_operation.kind = 'deposit' AND v_contract.escrow_status <> 'awaiting_deposit')
    OR (v_operation.kind = 'payout' AND v_contract.escrow_status NOT IN ('work_submitted', 'disputed'))
    OR (v_operation.kind = 'refund' AND v_contract.escrow_status <> 'disputed') THEN
    RAISE EXCEPTION 'Contract state does not allow this payment operation';
  END IF;
  UPDATE public.payment_operations SET status = 'succeeded', provider_reference = LEFT(p_provider_reference, 255), completed_at = NOW()
    WHERE id = p_operation;
  UPDATE public.contracts SET escrow_status = v_target WHERE id = v_contract.id RETURNING * INTO v_contract;
  IF v_target = 'completed' AND v_contract.job_id IS NOT NULL THEN UPDATE public.jobs SET status = 'completed' WHERE id = v_contract.job_id; END IF;
  IF v_target = 'completed' AND v_contract.gig_id IS NOT NULL THEN UPDATE public.gigs SET orders_completed = orders_completed + 1 WHERE id = v_contract.gig_id; END IF;
  SELECT (v_operation.metadata ->> 'dispute_id')::UUID INTO v_dispute;
  IF v_dispute IS NOT NULL THEN UPDATE public.disputes SET status = 'resolved', updated_at = NOW() WHERE id = v_dispute; END IF;
  PERFORM public.log_contract_event(v_contract.id, NULL, 'payment_succeeded', jsonb_build_object('operation_id', p_operation, 'kind', v_operation.kind, 'provider_reference', p_provider_reference));
  INSERT INTO public.notifications(user_id, title, body, link) VALUES
    (v_contract.client_id, CASE WHEN v_target = 'funded' THEN 'Deposit confirmed' WHEN v_target = 'completed' THEN 'Contract completed' ELSE 'Refund completed' END,
     'Payment processing completed.', '/contracts/' || v_contract.id),
    (v_contract.freelancer_id, CASE WHEN v_target = 'funded' THEN 'Contract funded' WHEN v_target = 'completed' THEN 'Payment completed' ELSE 'Contract refunded' END,
     'Payment processing completed.', '/contracts/' || v_contract.id);
  RETURN v_contract;
END $$;

REVOKE ALL ON FUNCTION public.start_deposit_operation(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_release_operation(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.begin_dispute_review(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_dispute_resolution_operation(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_payment_operation(UUID, TEXT, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_deposit_operation(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_release_operation(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.begin_dispute_review(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_dispute_resolution_operation(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_payment_operation(UUID, TEXT, BOOLEAN, TEXT) TO service_role;
-- Security hardening: tamper-resistant audit events for privileged/server-side operations.
-- This table is intentionally append-only to application users. Write through a
-- server-side service-role integration only; never include secrets, tokens, or raw payment data.

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type ~ '^[a-z0-9_.-]{3,80}$'),
  request_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS security_events_created_at_idx
  ON public.security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_actor_id_idx
  ON public.security_events (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_event_type_idx
  ON public.security_events (event_type, created_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS security_events_admin_read ON public.security_events;
CREATE POLICY security_events_admin_read ON public.security_events
  FOR SELECT USING (public.is_admin());

-- No INSERT/UPDATE/DELETE policy is granted to anon/authenticated. The service role
-- bypasses RLS and is the only application identity allowed to write audit events.
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
-- MudayHub Freelance — 008 Telegram Alerts & Security Audit Hardening
-- Adds direct Telegram Bot Chat ID linkage to user profiles for instant push alerts.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;

CREATE INDEX IF NOT EXISTS profiles_telegram_chat_idx
  ON public.profiles(telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;

-- Ensure public directory never exposes personal Telegram ID to strangers
-- (Only the user themselves and platform admins can read their personal telegram chat ID)
DROP FUNCTION IF EXISTS public.get_public_profiles(UUID[]);
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_ids UUID[])
RETURNS TABLE (
  id UUID,
  role public.user_role,
  full_name TEXT,
  bio TEXT,
  skills TEXT[],
  rating NUMERIC,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.role, p.full_name, p.bio, p.skills, p.rating,
         p.is_verified, p.created_at
  FROM public.profiles p
  WHERE p_ids IS NULL OR p.id = ANY(p_ids);
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(UUID[]) TO anon, authenticated;
-- MudayHub Freelance — 009 Freelancer Portfolio, Credentials & Experience
-- Adds rich professional profile fields (Headline, GitHub, Portfolio, Past Projects,
-- Work Experience, Education, Certifications & Honors).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS past_projects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Update get_public_profiles RPC to expose portfolio and credential showcase fields to visitors
DROP FUNCTION IF EXISTS public.get_public_profiles(UUID[]);
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_ids UUID[])
RETURNS TABLE (
  id UUID,
  role public.user_role,
  full_name TEXT,
  headline TEXT,
  bio TEXT,
  skills TEXT[],
  github_url TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  past_projects JSONB,
  experience JSONB,
  education JSONB,
  certifications JSONB,
  rating NUMERIC,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.role, p.full_name, p.headline, p.bio, p.skills,
         p.github_url, p.portfolio_url, p.linkedin_url,
         p.past_projects, p.experience, p.education, p.certifications,
         p.rating, p.is_verified, p.created_at
  FROM public.profiles p
  WHERE p_ids IS NULL OR p.id = ANY(p_ids);
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(UUID[]) TO anon, authenticated;
-- MudayHub Freelance - Migration 010
-- Strict Duplicate Account Prevention
-- Ensures no duplicate email, phone number, or telebirr payout destinations across accounts

-- 1. Partial unique index on non-null/non-empty telebirr_number in profiles
CREATE UNIQUE INDEX IF NOT EXISTS profiles_telebirr_number_unique_idx
  ON profiles (telebirr_number)
  WHERE telebirr_number IS NOT NULL AND telebirr_number <> '';

-- 2. Ensure case-insensitive uniqueness check on email via auth.users
-- auth.users in Supabase standardly enforces unique emails; profiles.phone has UNIQUE constraint from migration 001.

COMMENT ON INDEX profiles_telebirr_number_unique_idx IS
  'Prevents duplicate accounts from registering or binding the same Telebirr payout wallet.';
-- MudayHub Freelance - Migration 011
-- Profile Photo (Avatar) and Domestic Payment & Payout Rails

-- 1. Add avatar_url to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Add payment_methods JSONB array to profiles
-- Stores structured payment rails: Telebirr, CBE Birr, Ethiopian Commercial Bank accounts
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb;

-- 3. Update public profiles view / RPC if needed
-- Note: payment_methods is PRIVATE and must never be exposed via get_public_profiles
DROP FUNCTION IF EXISTS public.get_public_profiles();
DROP FUNCTION IF EXISTS public.get_public_profiles(UUID[]);
CREATE OR REPLACE FUNCTION get_public_profiles()
RETURNS SETOF profiles AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    role,
    full_name,
    NULL::text as phone,
    bio,
    skills,
    NULL::text as telebirr_number,
    rating,
    is_verified,
    created_at,
    NULL::text as telegram_chat_id,
    NULL::text as telegram_username,
    headline,
    github_url,
    portfolio_url,
    linkedin_url,
    past_projects,
    experience,
    education,
    certifications,
    avatar_url,
    '[]'::jsonb as payment_methods
  FROM profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
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
-- MudayHub Freelance — Migration 013
-- Contract Deliverables Storage Registry & Realtime Publication Hardening

-- 1. Create contract_uploads table for private deliverable archives & evidence
CREATE TABLE IF NOT EXISTS public.contract_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploader_id UUID NOT NULL REFERENCES auth.users(id),
  purpose TEXT NOT NULL DEFAULT 'deliverable'
    CHECK (purpose IN ('deliverable', 'evidence', 'specification', 'attachment')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_uploads_contract_id ON public.contract_uploads(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_uploads_uploader_id ON public.contract_uploads(uploader_id);

-- 2. Row Level Security (RLS) for contract_uploads
ALTER TABLE public.contract_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Uploads readable by contract participants and admin" ON public.contract_uploads;
CREATE POLICY "Uploads readable by contract participants and admin" ON public.contract_uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_uploads.contract_id
      AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Uploads insertable by contract participants" ON public.contract_uploads;
CREATE POLICY "Uploads insertable by contract participants" ON public.contract_uploads
  FOR INSERT WITH CHECK (
    auth.uid() = uploader_id AND
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_uploads.contract_id
      AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

-- 3. Storage bucket provisioning for private contract files & public avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-files', 'contract-files', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies for contract-files
DROP POLICY IF EXISTS "Contract files accessible to authenticated users" ON storage.objects;
CREATE POLICY "Contract files accessible to authenticated users"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contract-files');

DROP POLICY IF EXISTS "Contract files uploadable by authenticated users" ON storage.objects;
CREATE POLICY "Contract files uploadable by authenticated users"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contract-files');

-- Storage object policies for avatars
DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
CREATE POLICY "Avatars publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatars uploadable by owner" ON storage.objects;
CREATE POLICY "Avatars uploadable by owner"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- 4. Idempotently add disputes and worklogs tables to Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'disputes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'worklogs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.worklogs;
  END IF;
END $$;
