export type AssetType = "stock" | "etf" | "crypto";

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  nativeCurrency: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
}
