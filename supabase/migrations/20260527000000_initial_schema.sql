-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- users
-- Mirrors auth.users (same id value). Stores app-specific prefs only.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.users (
  id            text        primary key,
  display_name  text        not null default '',
  base_currency char(3)     not null default 'USD',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users: own row only"
  on public.users for all
  using (id = auth.uid()::text);

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- invite_tokens
-- ─────────────────────────────────────────────────────────────────────────────

create table public.invite_tokens (
  id          text        primary key,
  token       text        not null unique,
  created_by  text        not null references public.users(id),
  used_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.invite_tokens enable row level security;

create policy "invite_tokens: owner can manage"
  on public.invite_tokens for all
  using (created_by = auth.uid()::text);

create trigger invite_tokens_updated_at
  before update on public.invite_tokens
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- assets
-- Global catalogue, shared across all users.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.assets (
  id               text    primary key,
  symbol           text    not null,
  name             text    not null,
  asset_type       text    not null check (asset_type in ('stock', 'etf', 'crypto')),
  native_currency  char(3) not null,
  provider_id      text    not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (symbol, asset_type)
);

create index assets_provider_id_idx on public.assets (provider_id);

alter table public.assets enable row level security;

create policy "assets: authenticated read"
  on public.assets for select
  using (auth.role() = 'authenticated');

create trigger assets_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- holdings
-- ─────────────────────────────────────────────────────────────────────────────

create table public.holdings (
  id                   text           primary key,
  user_id              text           not null references public.users(id),
  asset_id             text           not null references public.assets(id),
  quantity             numeric(20, 8) not null,
  cost_basis           numeric(20, 8) not null,
  cost_basis_currency  char(3)        not null,
  notes                text,
  created_at           timestamptz    not null default now(),
  updated_at           timestamptz    not null default now()
);

create index holdings_user_asset_idx on public.holdings (user_id, asset_id);

alter table public.holdings enable row level security;

create policy "holdings: own rows only"
  on public.holdings for all
  using (user_id = auth.uid()::text);

create trigger holdings_updated_at
  before update on public.holdings
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- price_candles
-- Append-only OHLCV, written by background sync job only.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.price_candles (
  id           text           primary key,
  asset_id     text           not null references public.assets(id),
  open         numeric(20, 8) not null,
  high         numeric(20, 8) not null,
  low          numeric(20, 8) not null,
  close        numeric(20, 8) not null,
  volume       bigint         not null,
  currency     char(3)        not null,
  period_start timestamptz    not null,
  period_end   timestamptz    not null,
  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now(),
  unique (asset_id, period_start, period_end)
);

create index price_candles_asset_period_idx on public.price_candles (asset_id, period_end desc);

alter table public.price_candles enable row level security;

create policy "price_candles: authenticated read"
  on public.price_candles for select
  using (auth.role() = 'authenticated');

create trigger price_candles_updated_at
  before update on public.price_candles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- portfolio_snapshots
-- ─────────────────────────────────────────────────────────────────────────────

create table public.portfolio_snapshots (
  id              text           primary key,
  user_id         text           not null references public.users(id),
  total_value     numeric(20, 8) not null,
  currency        char(3)        not null,
  snapshotted_at  timestamptz    not null default now(),
  created_at      timestamptz    not null default now(),
  updated_at      timestamptz    not null default now()
);

create index portfolio_snapshots_user_time_idx on public.portfolio_snapshots (user_id, snapshotted_at);

alter table public.portfolio_snapshots enable row level security;

create policy "portfolio_snapshots: own rows only"
  on public.portfolio_snapshots for all
  using (user_id = auth.uid()::text);

create trigger portfolio_snapshots_updated_at
  before update on public.portfolio_snapshots
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- custom_assets
-- ─────────────────────────────────────────────────────────────────────────────

create table public.custom_assets (
  id         text           primary key,
  user_id    text           not null references public.users(id),
  name       text           not null,
  value      numeric(20, 8) not null,
  currency   char(3)        not null,
  created_at timestamptz    not null default now(),
  updated_at timestamptz    not null default now()
);

alter table public.custom_assets enable row level security;

create policy "custom_assets: own rows only"
  on public.custom_assets for all
  using (user_id = auth.uid()::text);

create trigger custom_assets_updated_at
  before update on public.custom_assets
  for each row execute function public.set_updated_at();
