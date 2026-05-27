export interface PortfolioSnapshot {
  id: string;
  userId: string;
  totalValue: string;
  currency: string;
  snapshottedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
