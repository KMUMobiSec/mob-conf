-- Registrations realtime hardening — apply in the Supabase SQL editor AFTER deploying the
-- Broadcast-based live updates (lib/supabase/broadcast.ts + useRegistrationsRealtime).
--
-- WHY: the admin dashboard's browser connects to Supabase as the anon role (no Supabase JWT — auth
-- is handled by better-auth). Previously it subscribed to `postgres_changes` on `registrations`,
-- which requires anon to be able to SELECT the table — meaning anyone with the public anon key could
-- dump every attendee's name / email / affiliation via PostgREST. Live updates now arrive as a
-- payload-less Broadcast ping instead, so the browser never needs to read this table directly and it
-- can be locked down.
--
-- SAFE FOR THE SERVER: Next.js reads `registrations` through the direct Postgres connection
-- (DATABASE_URL), whose role bypasses row-level security — so enabling RLS here does NOT affect any
-- server query (listRegistrations, check-in, etc.). Supabase's default `postgres` role has BYPASSRLS;
-- confirm your DATABASE_URL uses it (not a restricted role) before applying in production.

alter table public.registrations enable row level security;

-- Intentionally NO anon/authenticated SELECT policy: with RLS on and no permissive policy, PostgREST
-- and postgres_changes return zero rows to the public key. Broadcast is unaffected (it's authorized
-- on the channel/realtime.messages, not on this table). Add a scoped policy later only if some
-- browser client ever needs direct table reads.

-- OPTIONAL cleanup: registrations no longer needs to be in the realtime publication now that live
-- updates use Broadcast rather than postgres_changes. Removing it stops wasted WAL processing.
-- Uncomment if it was added previously (harmless error if it isn't there):
--   alter publication supabase_realtime drop table public.registrations;
