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
