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
