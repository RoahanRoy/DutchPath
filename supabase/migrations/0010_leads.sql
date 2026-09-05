-- 0010_leads.sql
--
-- Email capture for the public marketing surface (/settle-in-nl and the
-- generated /guides pages).
--
-- Design notes, following 0005/0006/0008/0009:
--
--  1. Not `settle_`-prefixed. This is not Settle track content: it is the
--     acquisition layer's mailing list, written by anonymous visitors who have
--     no user_id and no settle_profile.
--
--  2. WRITE-ONLY from the client. There is exactly one policy, for INSERT.
--     With RLS enabled and no SELECT/UPDATE/DELETE policy, neither the anon nor
--     the authenticated key can read a single row, let alone enumerate the
--     list. Export is a service-role job. The explicit REVOKE below is
--     belt-and-braces over Supabase's default grants on `public`, in the same
--     spirit as the hardening in 0006.
--
--  3. The INSERT policy is `with check (true)` and not the `(select auth.uid())`
--     form used everywhere else in this schema — deliberately. A lead has no
--     authenticated user to match against; that IS the feature. The safety here
--     comes from the table being unreadable, not from row ownership.
--
--  4. Unique on lower(email) so a visitor who submits twice does not create a
--     second row. The client renders the resulting 23505 as success: it is the
--     honest outcome ("you're on the list") and reveals nothing an attacker
--     could not already learn by submitting an address they control.
--
--  5. Nothing here awards XP, streaks or achievements, and nothing here is
--     joined to auth.users. A lead is not an account.
--
--  6. Accepted risk: with no API layer of our own there is no rate limit on this
--     insert. The unique index bounds row growth, the table holds no PII beyond
--     the address volunteered, and nothing can read it back. A Supabase-side
--     rate limit is the follow-up if this is ever abused.

begin;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  -- Not a full RFC 5322 validation, which is a famous waste of time. This only
  -- rejects the obviously-not-an-address so the list stays cheap to export.
  email text not null
    check (position('@' in email) > 1 and length(email) between 3 and 254),
  -- Which surface it came from: 'landing', 'guide:<slug>'. Bounded so a crafted
  -- client cannot use it as free storage.
  source text not null default 'unknown' check (length(source) <= 64),
  created_at timestamptz not null default now()
);

-- Case-insensitive: Alice@x.com and alice@x.com are one person.
create unique index if not exists leads_email_key
  on public.leads (lower(email));

-- The only read that will ever matter is "newest first", from a service-role
-- export job.
create index if not exists leads_created_at_idx
  on public.leads (created_at desc);

alter table public.leads enable row level security;

drop policy if exists leads_insert_public on public.leads;
create policy leads_insert_public on public.leads
  for insert to anon, authenticated with check (true);

-- No SELECT, UPDATE or DELETE policy: see note 2.

grant insert on public.leads to anon, authenticated;
revoke select, update, delete on public.leads from anon, authenticated;

-- Supabase's schema defaults also hand out TRUNCATE / REFERENCES / TRIGGER, and
-- TRUNCATE is NOT subject to RLS. PostgREST exposes no TRUNCATE endpoint, so
-- this is hardening rather than a live hole -- but the grants should match the
-- write-only contract above. Scoped to this table on purpose: every other table
-- in the schema carries the same default, and changing those belongs in its own
-- pass rather than in a marketing feature.
revoke truncate, references, trigger on public.leads from anon, authenticated;

commit;
