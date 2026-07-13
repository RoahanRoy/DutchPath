-- 0007_track_stats_rpc.sql
--
-- 0006 revoked table-wide UPDATE on `profiles` and re-granted only the
-- user-editable preference columns. That (correctly) locked down xp/streak,
-- but it also broke the per-track stat counters: the writing editor, the
-- listening player and the writing exam runner were still incrementing
-- writing_xp_total / writing_completed_count / listening_xp_total /
-- listening_completed_count with direct client-side UPDATEs, which now fail
-- with "permission denied" (and the errors were unchecked, so the counters
-- silently stopped moving).
--
-- Fix: move those increments behind a SECURITY DEFINER RPC, mirroring the
-- pattern of increment_xp in 0006 — caller must be the row owner, amounts are
-- bounded, and the function (not the client) owns the read-modify-write, which
-- also removes the old racy select-then-update.

begin;

create or replace function public.increment_track_stats(
  p_user_id uuid, p_track text, p_xp integer, p_completed integer default 1)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  -- Defensive bounds, same rationale as increment_xp.
  if p_xp is null or p_xp < 0 or p_xp > 10000
     or p_completed is null or p_completed < 0 or p_completed > 1 then
    raise exception 'invalid amount' using errcode = '22023';
  end if;

  if p_track = 'writing' then
    update profiles
    set writing_xp_total = writing_xp_total + p_xp,
        writing_completed_count = writing_completed_count + p_completed
    where id = p_user_id;
  elsif p_track = 'listening' then
    update profiles
    set listening_xp_total = listening_xp_total + p_xp,
        listening_completed_count = listening_completed_count + p_completed
    where id = p_user_id;
  else
    raise exception 'invalid track' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.increment_track_stats(uuid, text, integer, integer) from anon, public;
grant execute on function public.increment_track_stats(uuid, text, integer, integer) to authenticated, service_role;

commit;
