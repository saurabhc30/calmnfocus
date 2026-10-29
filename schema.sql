-- Run this whole file once in the Supabase SQL editor.

-- 1) Remove EVERY old version of the functions (duplicate overloads break the API call)
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig
           from pg_proc p
           where p.proname in ('submit_score','submit_streak')
             and p.pronamespace = 'public'::regnamespace
  loop
    execute 'drop function ' || r.sig;
  end loop;
end $$;

-- 2) Make sure the columns the functions use exist
alter table streaks add column if not exists updated_at timestamptz not null default now();

-- 3) Score function: saves all-time best AND today's best
create function submit_score(g text, v numeric) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  low boolean := g in ('reflex','schulte');
  today date := (now() at time zone 'utc')::date;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if g not in ('reflex','schulte','stroop','seq','num') then raise exception 'bad game'; end if;
  if g = 'reflex' and (v < 1 or v > 10000) then raise exception 'reflex value out of range'; end if;
  if not exists (select 1 from profiles where user_id = uid) then raise exception 'no profile'; end if;

  insert into scores(user_id, game, value) values (uid, g, v)
  on conflict (user_id, game) do update
    set value = excluded.value, updated_at = now()
    where (low and excluded.value < scores.value) or (not low and excluded.value > scores.value);

  insert into daily_scores(user_id, game, day, value) values (uid, g, today, v)
  on conflict (user_id, game, day) do update
    set value = excluded.value, updated_at = now()
    where (low and excluded.value < daily_scores.value) or (not low and excluded.value > daily_scores.value);
end $$;

-- 4) Streak function
create function submit_streak(cur int, best int, d date) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  insert into streaks(user_id, current_streak, best_streak, last_day)
  values (uid, least(cur,400), least(greatest(best,cur),400), d)
  on conflict (user_id) do update
    set current_streak = excluded.current_streak,
        best_streak = greatest(streaks.best_streak, excluded.best_streak),
        last_day = excluded.last_day,
        updated_at = now();
end $$;

grant execute on function submit_score(text, numeric) to authenticated;
grant execute on function submit_streak(int, int, date) to authenticated;

-- 5) Remove the impossible test value so real reflex scores can count
delete from scores where game = 'reflex' and value < 50;

-- 6) Optional check: the leaderboard needs scores/streaks/daily_scores to link to profiles.
--    Every row below should show confrelid = profiles. If it shows auth.users, tell me.
select conrelid::regclass as tbl, conname, confrelid::regclass as links_to
from pg_constraint
where contype = 'f' and conrelid in ('scores'::regclass,'streaks'::regclass,'daily_scores'::regclass);