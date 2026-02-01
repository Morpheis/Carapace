-- =============================================
-- Migration 002: Rate Limiting & Platform Stats
-- =============================================

-- ── Drop old rate_limits table ──
-- The initial design used (agent_id, endpoint, window_key) but the
-- middleware uses composite string keys. Redesign for the actual pattern.
drop table if exists rate_limits;

-- ── Rate Limits (redesigned) ──

create table rate_limits (
  key           text not null,
  window_start  bigint not null,
  count         integer not null default 1,
  reset_at      bigint not null,
  primary key (key, window_start)
);

-- Index for cleanup queries
create index rate_limits_reset_at_idx on rate_limits(reset_at);

-- Atomic increment function — handles concurrent requests safely
create or replace function increment_rate_limit(
  p_key text,
  p_window_seconds integer
)
returns table(count integer, reset_at bigint)
language plpgsql
as $$
declare
  v_now bigint;
  v_window_start bigint;
  v_reset_at bigint;
begin
  v_now := extract(epoch from now())::bigint;
  v_window_start := v_now - (v_now % p_window_seconds);
  v_reset_at := v_window_start + p_window_seconds;

  insert into rate_limits (key, window_start, count, reset_at)
  values (p_key, v_window_start, 1, v_reset_at)
  on conflict (key, window_start)
  do update set count = rate_limits.count + 1
  returning rate_limits.count, rate_limits.reset_at
  into count, reset_at;

  return next;
end;
$$;

-- Cleanup old windows (call periodically or via pg_cron)
create or replace function cleanup_rate_limits(
  older_than_seconds integer default 86400
)
returns integer
language plpgsql
as $$
declare
  deleted_count integer;
begin
  delete from rate_limits
  where reset_at < extract(epoch from now())::bigint - older_than_seconds;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ── Platform Counters ──

create table platform_counters (
  key    text primary key,
  value  bigint not null default 0
);

-- Atomic increment function
create or replace function increment_counter(
  p_key text,
  p_amount integer default 1
)
returns bigint
language plpgsql
as $$
declare
  new_value bigint;
begin
  insert into platform_counters (key, value)
  values (p_key, p_amount)
  on conflict (key)
  do update set value = platform_counters.value + p_amount
  returning value into new_value;

  return new_value;
end;
$$;

-- ── Domain count helper ──

create or replace function count_unique_domains()
returns bigint
language sql stable
as $$
  select count(distinct tag)
  from contributions, unnest(domain_tags) as tag;
$$;

-- ── RLS for new tables ──

alter table rate_limits enable row level security;
alter table platform_counters enable row level security;

-- Service role has full access; these tables aren't client-facing
create policy "rate_limits_service" on rate_limits
  using (true) with check (true);

create policy "platform_counters_service" on platform_counters
  using (true) with check (true);
