CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE public.users (
  id            TEXT        PRIMARY KEY,
  display_name  TEXT        NOT NULL DEFAULT '',
  base_currency CHAR(3)     NOT NULL DEFAULT 'USD',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: own row only"
  ON public.users FOR ALL
  TO authenticated
  USING (id = (SELECT auth.uid())::TEXT)
  WITH CHECK (id = (SELECT auth.uid())::TEXT);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.invite_tokens (
  id          TEXT        PRIMARY KEY,
  token       TEXT        NOT NULL UNIQUE,
  created_by  TEXT        NOT NULL REFERENCES public.users(id),
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invite_tokens: owner can manage"
  ON public.invite_tokens FOR ALL
  TO authenticated
  USING (created_by = (SELECT auth.uid())::TEXT)
  WITH CHECK (created_by = (SELECT auth.uid())::TEXT);

CREATE TRIGGER invite_tokens_updated_at
  BEFORE UPDATE ON public.invite_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Global catalogue, shared across all users.
CREATE TABLE public.assets (
  id               TEXT    PRIMARY KEY,
  symbol           TEXT    NOT NULL,
  name             TEXT    NOT NULL,
  asset_type       TEXT    NOT NULL CHECK (asset_type IN ('stock', 'etf', 'crypto')),
  native_currency  CHAR(3) NOT NULL,
  provider_id      TEXT    NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, asset_type)
);

CREATE INDEX assets_provider_id_idx ON public.assets (provider_id);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets: authenticated read"
  ON public.assets FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.holdings (
  id                   TEXT           PRIMARY KEY,
  user_id              TEXT           NOT NULL REFERENCES public.users(id),
  asset_id             TEXT           NOT NULL REFERENCES public.assets(id),
  quantity             NUMERIC(20, 8) NOT NULL,
  cost_basis           NUMERIC(20, 8) NOT NULL,
  cost_basis_currency  CHAR(3)        NOT NULL,
  notes                TEXT,
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX holdings_user_asset_idx ON public.holdings (user_id, asset_id);

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "holdings: own rows only"
  ON public.holdings FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid())::TEXT)
  WITH CHECK (user_id = (SELECT auth.uid())::TEXT);

CREATE TRIGGER holdings_updated_at
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Append-only OHLCV, written by background sync job only.
CREATE TABLE public.price_candles (
  id           TEXT           PRIMARY KEY,
  asset_id     TEXT           NOT NULL REFERENCES public.assets(id),
  open         NUMERIC(20, 8) NOT NULL,
  high         NUMERIC(20, 8) NOT NULL,
  low          NUMERIC(20, 8) NOT NULL,
  close        NUMERIC(20, 8) NOT NULL,
  volume       BIGINT         NOT NULL,
  currency     CHAR(3)        NOT NULL,
  period_start TIMESTAMPTZ    NOT NULL,
  period_end   TIMESTAMPTZ    NOT NULL,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, period_start, period_end)
);

CREATE INDEX price_candles_asset_period_idx ON public.price_candles (asset_id, period_end DESC);

ALTER TABLE public.price_candles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_candles: authenticated read"
  ON public.price_candles FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE public.portfolio_snapshots (
  id              TEXT           PRIMARY KEY,
  user_id         TEXT           NOT NULL REFERENCES public.users(id),
  total_value     NUMERIC(20, 8) NOT NULL,
  currency        CHAR(3)        NOT NULL,
  snapshotted_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX portfolio_snapshots_user_time_idx ON public.portfolio_snapshots (user_id, snapshotted_at);

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_snapshots: own rows only"
  ON public.portfolio_snapshots FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid())::TEXT)
  WITH CHECK (user_id = (SELECT auth.uid())::TEXT);

CREATE TRIGGER portfolio_snapshots_updated_at
  BEFORE UPDATE ON public.portfolio_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.custom_assets (
  id         TEXT           PRIMARY KEY,
  user_id    TEXT           NOT NULL REFERENCES public.users(id),
  name       TEXT           NOT NULL,
  value      NUMERIC(20, 8) NOT NULL,
  currency   CHAR(3)        NOT NULL,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

ALTER TABLE public.custom_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_assets: own rows only"
  ON public.custom_assets FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid())::TEXT)
  WITH CHECK (user_id = (SELECT auth.uid())::TEXT);

CREATE TRIGGER custom_assets_updated_at
  BEFORE UPDATE ON public.custom_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
