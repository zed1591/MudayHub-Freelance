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
