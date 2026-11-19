-- MudayHub Freelance — Incremental Update for Existing Database
-- Safely applies latest schema features, column additions, worklogs, trust deeds, deliverables storage & realtime publication

-- 1. Safely drop existing function before altering return signature
DROP FUNCTION IF EXISTS public.get_public_profiles(UUID[]);
DROP FUNCTION IF EXISTS public.get_public_profiles();

-- 2. Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS past_projects JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS profiles_telegram_chat_idx
  ON public.profiles(telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;

-- 3. Recreate get_public_profiles function with latest columns (privacy safe: excludes phone, telebirr, payment_methods)
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_ids UUID[])
RETURNS TABLE (
  id UUID,
  role public.user_role,
  full_name TEXT,
  headline TEXT,
  bio TEXT,
  skills TEXT[],
  avatar_url TEXT,
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
  SELECT 
    p.id, 
    p.role, 
    p.full_name, 
    p.headline,
    p.bio, 
    p.skills, 
    p.avatar_url,
    p.github_url,
    p.portfolio_url,
    p.linkedin_url,
    p.past_projects,
    p.experience,
    p.education,
    p.certifications,
    p.rating,
    p.is_verified, 
    p.created_at
  FROM public.profiles p
  WHERE p_ids IS NULL OR p.id = ANY(p_ids);
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(UUID[]) TO anon, authenticated;

-- 4. Upgrade contracts & disputes tables
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS deed_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_contracts_deed_hash ON public.contracts(deed_hash);

ALTER TABLE public.disputes
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

-- 5. Create worklogs table for intermediate progress checkpoints
CREATE TABLE IF NOT EXISTS public.worklogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_worklogs_contract ON public.worklogs(contract_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_milestone ON public.worklogs(milestone_id);

ALTER TABLE public.worklogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Worklogs visible to contract participants" ON public.worklogs;
CREATE POLICY "Worklogs visible to contract participants" ON public.worklogs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = worklogs.contract_id
      AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Worklogs insertable by contract participants" ON public.worklogs;
CREATE POLICY "Worklogs insertable by contract participants" ON public.worklogs
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = worklogs.contract_id
      AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

-- 6. Create trust_deeds table for immutable verifiable trust ledger
CREATE TABLE IF NOT EXISTS public.trust_deeds (
  id TEXT PRIMARY KEY,
  deed_hash TEXT UNIQUE NOT NULL,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  gig_id TEXT REFERENCES public.gigs(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_trust_deeds_hash ON public.trust_deeds(deed_hash);
CREATE INDEX IF NOT EXISTS idx_trust_deeds_freelancer ON public.trust_deeds(freelancer_id);

ALTER TABLE public.trust_deeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trust deeds are publicly readable" ON public.trust_deeds;
CREATE POLICY "Trust deeds are publicly readable" ON public.trust_deeds
  FOR SELECT USING (true);

-- 7. Create contract_uploads table for deliverables and evidence
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

-- 8. Storage bucket provisioning
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-files', 'contract-files', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

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

-- 9. Realtime publication additions (idempotent)
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
