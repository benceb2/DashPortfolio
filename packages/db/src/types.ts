import type { ColumnType } from "kysely";

type Generated<T> = ColumnType<T, T | undefined, T | undefined>;
type Timestamp = ColumnType<Date, Date | string, Date | string>;
type GeneratedTimestamp = ColumnType<Date, Date | string | undefined, Date | string>;
type Numeric = ColumnType<string, string | number, string | number>;

export interface UsersTable {
  id: string;
  display_name: Generated<string>;
  base_currency: Generated<string>;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
}

export interface InviteTokensTable {
  id: string;
  token: string;
  created_by: string;
  used_at: Timestamp | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
}

export interface AssetsTable {
  id: string;
  symbol: string;
  name: string;
  asset_type: "stock" | "etf" | "crypto";
  native_currency: string;
  provider_id: string;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
}

export interface HoldingsTable {
  id: string;
  user_id: string;
  asset_id: string;
  quantity: Numeric;
  cost_basis: Numeric;
  cost_basis_currency: string;
  notes: string | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
}

export interface PriceCandlesTable {
  id: string;
  asset_id: string;
  open: Numeric;
  high: Numeric;
  low: Numeric;
  close: Numeric;
  volume: ColumnType<string, string | number | bigint, string | number | bigint>;
  currency: string;
  period_start: Timestamp;
  period_end: Timestamp;
  created_at: GeneratedTimestamp;
}

export interface PortfolioSnapshotsTable {
  id: string;
  user_id: string;
  total_value: Numeric;
  currency: string;
  snapshotted_at: GeneratedTimestamp;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
}

export interface CustomAssetsTable {
  id: string;
  user_id: string;
  name: string;
  value: Numeric;
  currency: string;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
}

export interface DB {
  users: UsersTable;
  invite_tokens: InviteTokensTable;
  assets: AssetsTable;
  holdings: HoldingsTable;
  price_candles: PriceCandlesTable;
  portfolio_snapshots: PortfolioSnapshotsTable;
  custom_assets: CustomAssetsTable;
}
