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
