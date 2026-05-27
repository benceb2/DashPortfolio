export interface PriceCandle {
  id: string;
  assetId: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}
