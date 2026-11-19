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
