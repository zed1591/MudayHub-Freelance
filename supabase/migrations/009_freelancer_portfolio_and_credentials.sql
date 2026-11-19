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
