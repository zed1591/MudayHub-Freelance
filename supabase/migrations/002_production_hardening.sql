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
