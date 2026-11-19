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
