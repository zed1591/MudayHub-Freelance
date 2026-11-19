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
